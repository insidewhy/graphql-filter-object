import { DocumentNode, SelectionSetNode } from 'graphql/language/ast'

// eslint-disable-next-line no-use-before-define
type GraphqlFilterMap = Map<string, null | GraphqlObjectFilter>

export class GraphqlObjectFilter {
  filters: GraphqlFilterMap = new Map()
  fragmentFilters: Map<string, GraphqlObjectFilter> | undefined

  addFragmentFilter(typename: string, objectFilter: GraphqlObjectFilter): void {
    if (this.fragmentFilters === undefined) {
      this.fragmentFilters = new Map()
    }
    this.fragmentFilters.set(typename, objectFilter)
  }

  filter<T extends Array<unknown> | Record<string, unknown>>(object: T): T {
    if (object instanceof Array) {
      return (object as Array<unknown>).map((item) =>
        this.filter(item as Array<unknown> | Record<string, unknown>),
      ) as T
    } else {
      return this.filterObject(object as Record<string, unknown>) as T
    }
  }

  filterObject<T extends Record<string, unknown>>(object: T): T {
    const newObject: Record<string, unknown> = {}

    if (this.fragmentFilters) {
      const typename = object['__typename']
      if (typename) {
        const fragmentFilter = this.fragmentFilters.get(typename as string)
        if (fragmentFilter) {
          // don't worry about these fields getting overriddent later, that
          // can only happen with semantically invalid graphql
          const fragmentFields = fragmentFilter.filter(object)
          for (const [key, value] of Object.entries(fragmentFields)) {
            newObject[key] = value
          }
        }
      }
    }

    for (const [key, value] of Object.entries(object)) {
      const filterEntry = this.filters.get(key)
      if (filterEntry === undefined) {
        continue
      }
      if (filterEntry === null) {
        if (typeof value === 'object') {
          throw new Error(`Unexpected object for ${key} entry in object`)
        } else {
          newObject[key] = value
        }
      } else {
        if (typeof value !== 'object') {
          throw new Error(
            `Object ${key} should be object but found primitive value ${value}`,
          )
        }
        if (value === null) {
          newObject[key] = null
        } else {
          const newValue = filterEntry.filter(value as any)
          newObject[key] = newValue
        }
      }
    }
    return newObject as T
  }
}

type GraphqlFragmentDefinitionMap = Map<
  string,
  { typename: string; filter: GraphqlObjectFilter }
>

function buildFilterEntryFromSelectionSet(
  objectFilter: GraphqlObjectFilter,
  selectionSet: SelectionSetNode,
  fragmentFilters: GraphqlFragmentDefinitionMap,
): void {
  for (const selection of selectionSet.selections) {
    switch (selection.kind) {
      case 'FragmentSpread': {
        const fragmentName = selection.name.value
        const fragmentFilter = fragmentFilters.get(fragmentName)
        if (!fragmentFilter) {
          throw new Error(
            `Found reference to non-existent fragment ${fragmentName}`,
          )
        } else {
          objectFilter.addFragmentFilter(
            fragmentFilter.typename,
            fragmentFilter.filter,
          )
        }
        break
      }

      case 'Field': {
        const filterEntry = selection.alias
          ? selection.alias.value
          : selection.name.value
        if (selection.selectionSet) {
          const setFilter = new GraphqlObjectFilter()
          objectFilter.filters.set(filterEntry, setFilter)
          buildFilterEntryFromSelectionSet(
            setFilter,
            selection.selectionSet,
            fragmentFilters,
          )
        } else {
          objectFilter.filters.set(filterEntry, null)
        }
        break
      }
    }
  }
}

export function buildGraphqlFilter(
  gqlObject: DocumentNode,
): GraphqlObjectFilter {
  const fragmentFilters: GraphqlFragmentDefinitionMap = new Map()
  const objectFilter = new GraphqlObjectFilter()

  for (const definition of gqlObject.definitions) {
    switch (definition.kind) {
      case 'FragmentDefinition':
        const fragmentFilter = new GraphqlObjectFilter()
        fragmentFilters.set(definition.name.value, {
          typename: definition.typeCondition.name.value,
          filter: fragmentFilter,
        })
        buildFilterEntryFromSelectionSet(
          fragmentFilter,
          definition.selectionSet,
          fragmentFilters,
        )
        break

      case 'OperationDefinition':
        buildFilterEntryFromSelectionSet(
          objectFilter,
          definition.selectionSet,
          fragmentFilters,
        )
    }
  }
  return objectFilter
}

export default buildGraphqlFilter
