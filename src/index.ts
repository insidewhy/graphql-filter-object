import { DocumentNode } from 'graphql/language/ast'

export type GraphqlFilter = Map<string, undefined | GraphqlFilter>

export function buildGraphqlFilter(gqlObject: DocumentNode): GraphqlFilter {
  // TODO:
  return new Map()
}

export function applyGraphqlFilter<
  T extends Array<unknown> | Record<string, unknown>,
>(filter: GraphqlFilter, object: T): T {
  // TODO:
  return object
}
