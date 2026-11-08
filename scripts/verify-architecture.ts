import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import * as ts from 'typescript'
import {
  API_CATALOG,
  REQUIRED_API_ENDPOINT_KEYS,
  type ApiEndpointDefinition,
} from '../server/http/catalog.ts'

export interface DiscoveredApiRoute {
  readonly method: string
  readonly routePattern: string
  readonly filePath: string
  readonly wrapped: boolean
}

export interface ArchitectureIssue {
  readonly filePath: string
  readonly message: string
}

interface SourceFile {
  readonly absolutePath: string
  readonly relativePath: string
  readonly source: ts.SourceFile
}

const httpMethods = new Set(['get', 'post', 'put', 'patch', 'delete'])
const rootPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export function routePatternFromFile(
  relativePath: string,
): Pick<DiscoveredApiRoute, 'method' | 'routePattern'> | undefined {
  const withoutPrefix = relativePath.replace(/^server\/api\//, '')
  const match = withoutPrefix.match(/\.([a-z]+)\.(?:[cm]?[jt]s|[jt]sx)$/i)
  if (!match || !httpMethods.has(match[1].toLowerCase())) {
    return undefined
  }

  const routePath = withoutPrefix.slice(0, -match[0].length)
  const segments = routePath.split('/').filter(Boolean)
  const normalizedSegments: string[] = []

  for (const segment of segments) {
    if (segment === 'index') {
      continue
    }
    if (/^\[\.\.\..+\]$/.test(segment)) {
      return undefined
    }
    const parameter = segment.match(/^\[(.+)\]$/)
    normalizedSegments.push(parameter ? `:${parameter[1]}` : segment)
  }

  return {
    method: match[1].toUpperCase(),
    routePattern: `/api${normalizedSegments.length ? `/${normalizedSegments.join('/')}` : ''}`,
  }
}

function importsApiWrapper(source: ts.SourceFile): boolean {
  const localNames = new Set<string>()
  const namespaceNames = new Set<string>()
  const isWrapperModule = (specifier: string): boolean =>
    /(?:^|\/)http\/nuxt-endpoint(?:\.(?:[cm]?[jt]s|[jt]sx))?$/.test(specifier)

  for (const statement of source.statements) {
    if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
      if (!isWrapperModule(statement.moduleSpecifier.text)) {
        continue
      }
      if (statement.importClause?.namedBindings && ts.isNamedImports(statement.importClause.namedBindings)) {
        for (const element of statement.importClause.namedBindings.elements) {
          if (element.propertyName?.text === 'defineApiEndpoint' || element.name.text === 'defineApiEndpoint') {
            localNames.add(element.name.text)
          }
        }
      }
      continue
    }

    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (
          !declaration.initializer
          || !ts.isCallExpression(declaration.initializer)
          || !ts.isIdentifier(declaration.initializer.expression)
          || declaration.initializer.expression.text !== 'require'
          || !declaration.initializer.arguments[0]
          || !ts.isStringLiteral(declaration.initializer.arguments[0])
          || !isWrapperModule(declaration.initializer.arguments[0].text)
        ) {
          continue
        }

        if (ts.isIdentifier(declaration.name)) {
          namespaceNames.add(declaration.name.text)
        } else if (ts.isObjectBindingPattern(declaration.name)) {
          for (const element of declaration.name.elements) {
            const importedName = element.propertyName && ts.isIdentifier(element.propertyName)
              ? element.propertyName.text
              : ts.isIdentifier(element.name)
                ? element.name.text
                : ''
            if (importedName === 'defineApiEndpoint' && ts.isIdentifier(element.name)) {
              localNames.add(element.name.text)
            }
          }
        }
      }
    }
  }

  const isWrapperCall = (expression: ts.Expression): boolean =>
    ts.isCallExpression(expression)
    && (
      (ts.isIdentifier(expression.expression) && localNames.has(expression.expression.text))
      || (
        ts.isPropertyAccessExpression(expression.expression)
        && expression.expression.name.text === 'defineApiEndpoint'
        && ts.isIdentifier(expression.expression.expression)
        && namespaceNames.has(expression.expression.expression.text)
      )
    )

  return source.statements.some(statement =>
    (ts.isExportAssignment(statement) && isWrapperCall(statement.expression))
    || (
      ts.isExpressionStatement(statement)
      && ts.isBinaryExpression(statement.expression)
      && statement.expression.operatorToken.kind === ts.SyntaxKind.EqualsToken
      && ts.isPropertyAccessExpression(statement.expression.left)
      && ts.isIdentifier(statement.expression.left.expression)
      && statement.expression.left.expression.text === 'module'
      && statement.expression.left.name.text === 'exports'
      && isWrapperCall(statement.expression.right)
    ),
  )
}

function validCatalogEntry(entry: unknown): entry is ApiEndpointDefinition {
  if (typeof entry !== 'object' || entry === null) {
    return false
  }
  const candidate = entry as Partial<ApiEndpointDefinition>
  return typeof candidate.key === 'string'
    && typeof candidate.module === 'string'
    && typeof candidate.method === 'string'
    && typeof candidate.routePattern === 'string'
    && typeof candidate.description === 'string'
    && ['PUBLIC', 'AUTHENTICATED', 'RBAC'].includes(candidate.accessPolicy ?? '')
    && typeof candidate.implemented === 'boolean'
}

export function verifyApiCatalog(
  entries: readonly unknown[],
  requiredKeys: readonly string[] = REQUIRED_API_ENDPOINT_KEYS,
): ArchitectureIssue[] {
  const issues: ArchitectureIssue[] = []
  const byKey = new Map<string, ApiEndpointDefinition>()
  const byRoute = new Map<string, string>()
  const allowedMethods = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
  const allowedModules = new Set(['auth', 'users', 'roles', 'permissions'])

  for (const entry of entries) {
    if (!validCatalogEntry(entry)) {
      issues.push({ filePath: 'server/http/catalog.ts', message: 'Registro de endpoint inválido o sin política explícita.' })
      continue
    }

    if (byKey.has(entry.key)) {
      issues.push({ filePath: 'server/http/catalog.ts', message: `Clave duplicada: ${entry.key}.` })
    }
    byKey.set(entry.key, entry)

    const routeIdentity = `${entry.method} ${normalizeRoutePattern(entry.routePattern)}`
    const previousKey = byRoute.get(routeIdentity)
    if (previousKey) {
      issues.push({ filePath: 'server/http/catalog.ts', message: `Método/ruta duplicado: ${routeIdentity} (${previousKey}, ${entry.key}).` })
    }
    byRoute.set(routeIdentity, entry.key)

    if (!entry.routePattern.startsWith('/api/')) {
      issues.push({ filePath: 'server/http/catalog.ts', message: `Ruta no válida para ${entry.key}: ${entry.routePattern}.` })
    }
    if (!allowedMethods.has(entry.method)) {
      issues.push({ filePath: 'server/http/catalog.ts', message: `Método no válido para ${entry.key}: ${entry.method}.` })
    }
    if (!allowedModules.has(entry.module)) {
      issues.push({ filePath: 'server/http/catalog.ts', message: `Módulo no válido para ${entry.key}: ${entry.module}.` })
    }
    if (!entry.description.trim()) {
      issues.push({ filePath: 'server/http/catalog.ts', message: `Falta la descripción de ${entry.key}.` })
    }
  }

  for (const key of requiredKeys) {
    if (!byKey.has(key)) {
      issues.push({ filePath: 'server/http/catalog.ts', message: `Falta la entrada requerida: ${key}.` })
    }
  }

  for (const key of byKey.keys()) {
    if (!requiredKeys.includes(key)) {
      issues.push({ filePath: 'server/http/catalog.ts', message: `Entrada no definida en el contrato: ${key}.` })
    }
  }

  return issues
}

export function verifyApiRoutes(
  entries: readonly ApiEndpointDefinition[],
  routes: readonly DiscoveredApiRoute[],
): ArchitectureIssue[] {
  const issues: ArchitectureIssue[] = []
  const entriesByRoute = new Map(entries.map(entry => [
    `${entry.method} ${normalizeRoutePattern(entry.routePattern)}`,
    entry,
  ]))
  const seenRoutes = new Set<string>()

  for (const route of routes) {
    const routeIdentity = `${route.method} ${normalizeRoutePattern(route.routePattern)}`
    if (seenRoutes.has(routeIdentity)) {
      issues.push({ filePath: route.filePath, message: `Ruta descubierta duplicada: ${routeIdentity}.` })
    }
    seenRoutes.add(routeIdentity)

    const entry = entriesByRoute.get(routeIdentity)
    if (!entry) {
      issues.push({ filePath: route.filePath, message: `La ruta no tiene entrada de catálogo: ${routeIdentity}.` })
      continue
    }
    if (!entry.implemented) {
      issues.push({ filePath: route.filePath, message: `La ruta está activa pero el catálogo la marca como pendiente: ${entry.key}.` })
    }
    if (!route.wrapped) {
      issues.push({ filePath: route.filePath, message: `La ruta debe usar defineApiEndpoint: ${entry.key}.` })
    }
  }

  for (const entry of entries) {
    if (
      entry.implemented
      && !seenRoutes.has(`${entry.method} ${normalizeRoutePattern(entry.routePattern)}`)
    ) {
      issues.push({ filePath: 'server/http/catalog.ts', message: `Falta la ruta implementada ${entry.key}: ${entry.method} ${entry.routePattern}.` })
    }
  }

  return issues
}

function normalizeRoutePattern(routePattern: string): string {
  return routePattern
    .split('/')
    .map(segment => segment.startsWith(':') ? ':' : segment)
    .join('/')
}

async function collectFiles(directory: string, includeVue = false, includeAll = false): Promise<string[]> {
  let entries
  try {
    entries = await readdir(directory, { withFileTypes: true })
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return []
    }
    throw error
  }

  const files = await Promise.all(entries.map(async (entry) => {
    const absolutePath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      return collectFiles(absolutePath, includeVue, includeAll)
    }
    return includeAll
      || /\.(?:[cm]?[jt]s|[jt]sx)$/i.test(entry.name)
      || (includeVue && entry.name.endsWith('.vue'))
      ? [absolutePath]
      : []
  }))
  return files.flat()
}

async function readSourceFile(absolutePath: string): Promise<ts.SourceFile> {
  const contents = await readFile(absolutePath, 'utf8')
  const sourceText = absolutePath.endsWith('.vue')
    ? [...contents.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
      .map(match => match[1])
      .join('\n')
    : contents
  return ts.createSourceFile(absolutePath, sourceText, ts.ScriptTarget.Latest, true)
}

async function discoverApiRoutes(): Promise<DiscoveredApiRoute[]> {
  const apiRoot = path.join(rootPath, 'server/api')
  const files = await collectFiles(apiRoot, false, true)
  const routes: DiscoveredApiRoute[] = []

  for (const absolutePath of files) {
    const relativePath = path.relative(rootPath, absolutePath).split(path.sep).join('/')
    const route = routePatternFromFile(relativePath)
    if (!route) {
      routes.push({
        method: 'INVALID',
        routePattern: relativePath,
        filePath: relativePath,
        wrapped: false,
      })
      continue
    }
    const source = await readSourceFile(absolutePath)
    routes.push({
      ...route,
      filePath: relativePath,
      wrapped: importsApiWrapper(source),
    })
  }

  return routes
}

function importSpecifiers(source: ts.SourceFile): string[] {
  const specifiers: string[] = []
  const visit = (node: ts.Node): void => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
      && node.moduleSpecifier
      && ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text)
    } else if (
      ts.isCallExpression(node)
      && node.expression.kind === ts.SyntaxKind.ImportKeyword
      && node.arguments[0]
      && ts.isStringLiteral(node.arguments[0])
    ) {
      specifiers.push(node.arguments[0].text)
    } else if (
      ts.isCallExpression(node)
      && ts.isIdentifier(node.expression)
      && node.expression.text === 'require'
      && node.arguments[0]
      && ts.isStringLiteral(node.arguments[0])
    ) {
      specifiers.push(node.arguments[0].text)
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return specifiers
}

function resolveLocalImport(fromFile: string, specifier: string, sourceFiles: ReadonlyMap<string, SourceFile>): string | undefined {
  let basePath: string
  if (specifier.startsWith('.')) {
    basePath = path.resolve(path.dirname(fromFile), specifier)
  } else if (specifier.startsWith('@/') || specifier.startsWith('~/')) {
    basePath = path.join(rootPath, 'app', specifier.slice(2))
  } else if (specifier.startsWith('@@/') || specifier.startsWith('~~/')) {
    basePath = path.join(rootPath, specifier.slice(3))
  } else if (specifier === '#server' || specifier.startsWith('#server/')) {
    basePath = path.join(rootPath, 'server', specifier.slice('#server'.length).replace(/^\//, ''))
  } else if (specifier === '#shared' || specifier.startsWith('#shared/')) {
    basePath = path.join(rootPath, 'shared', specifier.slice('#shared'.length).replace(/^\//, ''))
  } else {
    return undefined
  }

  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.mts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.mjs`,
    `${basePath}.cjs`,
    `${basePath}.cts`,
    path.join(basePath, 'index.ts'),
    path.join(basePath, 'index.js'),
  ]
  return candidates.find(candidate => sourceFiles.has(candidate))
}

function checkModuleBoundaries(file: SourceFile, targetPath: string): string | undefined {
  const sourcePath = file.relativePath
  const targetRelativePath = path.relative(rootPath, targetPath).split(path.sep).join('/')

  if ((sourcePath.startsWith('app/') || sourcePath.startsWith('shared/')) && targetRelativePath.startsWith('server/')) {
    return 'La app y shared no pueden importar código del servidor.'
  }
  if (
    sourcePath.startsWith('server/platform/')
    && /^(server\/modules\/|server\/composition\/|server\/http\/|server\/api\/)/.test(targetRelativePath)
  ) {
    return 'platform no puede depender de módulos de negocio, composition ni HTTP.'
  }
  if (/^server\/modules\/[^/]+\//.test(sourcePath)) {
    const sourceModule = sourcePath.split('/')[2]
    if (
      /^server\/modules\/[^/]+\//.test(targetRelativePath)
      && targetRelativePath.split('/')[2] !== sourceModule
      && !targetRelativePath.endsWith(`/modules/${targetRelativePath.split('/')[2]}/index.ts`)
    ) {
      return 'Los módulos solo pueden importar la API pública index.ts de otro módulo.'
    }
    if (/^server\/(composition|http|api)\//.test(targetRelativePath)) {
      return 'Los módulos no pueden depender de composition ni de adaptadores HTTP.'
    }
  }

  return undefined
}

export function checkExternalImportBoundary(sourcePath: string, specifier: string): string | undefined {
  const isHttpPackage = /^(?:h3|nitropack|@nuxt\/nitro-server|node:http)(\/|$)/.test(specifier)
  const isPersistencePackage = /^(?:typeorm|pg)(\/|$)/.test(specifier)
  const isNuxtPackage = /^(?:nuxt|@nuxt\/)/.test(specifier)

  if (
    (sourcePath.startsWith('app/') || sourcePath.startsWith('shared/'))
    && (isHttpPackage || isPersistencePackage || specifier.startsWith('node:'))
  ) {
    return 'La app y shared no pueden depender de HTTP de servidor, Node ni persistencia.'
  }
  if (/^server\/modules\/[^/]+\//.test(sourcePath)) {
    if (isHttpPackage || isNuxtPackage) {
      return 'Los módulos de negocio no pueden depender de HTTP ni del runtime de Nuxt.'
    }
    if (
      /\/(?:application|domain)\//.test(sourcePath)
      && isPersistencePackage
    ) {
      return 'Los casos de uso y el dominio no pueden depender de TypeORM ni PostgreSQL.'
    }
  }
  if (
    sourcePath.startsWith('shared/')
    && isNuxtPackage
  ) {
    return 'shared no puede depender del runtime de Nuxt.'
  }

  return undefined
}

export function findDependencyCycles(graph: ReadonlyMap<string, readonly string[]>): string[][] {
  const state = new Map<string, 'visiting' | 'visited'>()
  const stack: string[] = []
  const cycles: string[][] = []
  const reported = new Set<string>()

  const visit = (filePath: string): void => {
    if (state.get(filePath) === 'visited') {
      return
    }
    if (state.get(filePath) === 'visiting') {
      const cycleStart = stack.indexOf(filePath)
      const cycle = [...stack.slice(cycleStart), filePath]
      const identity = [...new Set(cycle)].sort().join('|')
      if (!reported.has(identity)) {
        reported.add(identity)
        cycles.push(cycle)
      }
      return
    }

    state.set(filePath, 'visiting')
    stack.push(filePath)
    for (const dependency of graph.get(filePath) ?? []) {
      visit(dependency)
    }
    stack.pop()
    state.set(filePath, 'visited')
  }

  for (const filePath of graph.keys()) {
    visit(filePath)
  }
  return cycles
}

async function verifyDependencyBoundaries(): Promise<ArchitectureIssue[]> {
  const roots = ['app', 'server', 'shared']
  const absoluteFiles = (await Promise.all(
    roots.map(root => collectFiles(path.join(rootPath, root), root === 'app')),
  )).flat()
  const sourceFiles = new Map<string, SourceFile>()

  for (const absolutePath of absoluteFiles) {
    sourceFiles.set(absolutePath, {
      absolutePath,
      relativePath: path.relative(rootPath, absolutePath).split(path.sep).join('/'),
      source: await readSourceFile(absolutePath),
    })
  }

  const issues: ArchitectureIssue[] = []
  const graph = new Map<string, string[]>()
  for (const file of sourceFiles.values()) {
    const dependencies: string[] = []
    for (const specifier of importSpecifiers(file.source)) {
      if (/\.(?:css|scss|sass|less|svg|png|jpe?g|webp|gif|woff2?|ttf|json)$/i.test(specifier)) {
        continue
      }
      const externalBoundaryIssue = checkExternalImportBoundary(file.relativePath, specifier)
      if (externalBoundaryIssue) {
        issues.push({ filePath: file.relativePath, message: `${externalBoundaryIssue} (${specifier})` })
      }
      const targetPath = resolveLocalImport(file.absolutePath, specifier, sourceFiles)
      if (targetPath) {
        dependencies.push(targetPath)
        const boundaryIssue = checkModuleBoundaries(file, targetPath)
        if (boundaryIssue) {
          issues.push({ filePath: file.relativePath, message: `${boundaryIssue} (${specifier})` })
        }
      } else if (
        specifier.startsWith('.')
        || specifier.startsWith('@/') || specifier.startsWith('~/')
        || specifier.startsWith('@@/') || specifier.startsWith('~~/')
        || specifier === '#server' || specifier.startsWith('#server/')
        || specifier === '#shared' || specifier.startsWith('#shared/')
      ) {
        issues.push({ filePath: file.relativePath, message: `No se pudo resolver el import local ${specifier}.` })
      }
    }
    graph.set(file.absolutePath, dependencies)
  }

  for (const cycle of findDependencyCycles(graph)) {
    issues.push({
      filePath: path.relative(rootPath, cycle[0]).split(path.sep).join('/'),
      message: `Dependencia cíclica: ${cycle.map(file => path.relative(rootPath, file).split(path.sep).join('/')).join(' -> ')}.`,
    })
  }

  return issues
}

export async function verifyArchitecture(): Promise<ArchitectureIssue[]> {
  const [routes, boundaryIssues] = await Promise.all([
    discoverApiRoutes(),
    verifyDependencyBoundaries(),
  ])
  return [
    ...verifyApiCatalog(API_CATALOG),
    ...verifyApiRoutes(API_CATALOG, routes),
    ...boundaryIssues,
  ]
}

async function main(): Promise<void> {
  const issues = await verifyArchitecture()
  if (issues.length > 0) {
    for (const issue of issues) {
      console.error(`${issue.filePath}: ${issue.message}`)
    }
    process.exitCode = 1
    return
  }

  console.log(`Verificación arquitectónica correcta: ${API_CATALOG.length} entradas de catálogo; todas las rutas activas están registradas y envueltas; fronteras sin ciclos.`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await main()
}
