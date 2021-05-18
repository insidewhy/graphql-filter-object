import { gql } from 'graphql-tag'

import { buildGraphqlFilter, GraphqlObjectFilter } from '.'

describe('graphql-filter-object', () => {
  describe('buildGraphqlFilter', () => {
    type MapHelperEntries = Array<string | [string, GraphqlObjectFilter]>

    const map = (...entries: MapHelperEntries): GraphqlObjectFilter => {
      const objectFilter = new GraphqlObjectFilter()
      objectFilter.filters = new Map(
        entries.map((entry) =>
          typeof entry === 'string' ? [entry, null] : entry,
        ),
      )
      return objectFilter
    }

    const mapWithFragments = (
      fragments: Record<string, GraphqlObjectFilter>,
      ...entries: MapHelperEntries
    ): GraphqlObjectFilter => {
      const filter = map(...entries)
      for (const [typename, objectFilter] of Object.entries(fragments)) {
        filter.addFragmentFilter(typename, objectFilter)
      }
      return filter
    }

    it('works with nested selection sets', () => {
      const query = gql`
        query GetCat($catName: String!) {
          getCat(cats: $catName) {
            name
            qualities {
              qualityName
              loveliness
            }
          }
        }
      `
      const filter = buildGraphqlFilter(query)
      expect(filter).toEqual(
        map([
          'getCat',
          map('name', ['qualities', map('qualityName', 'loveliness')]),
        ]),
      )

      expect(
        filter.filter({
          getCat: {
            name: 'Jonsey',
            weight: 9_000,
            qualities: [
              {
                qualityName: 'furry',
                loveliness: 60,
                annoying: 10,
              },
              {
                qualityName: 'cuddly',
                loveliness: 100,
                annoying: 0,
              },
            ],
          },
        }),
      ).toEqual({
        getCat: {
          name: 'Jonsey',
          qualities: [
            {
              qualityName: 'furry',
              loveliness: 60,
            },
            {
              qualityName: 'cuddly',
              loveliness: 100,
            },
          ],
        },
      })
    })

    it('works with two aliased queries', () => {
      const query = gql`
        query GetCat($catName: String!) {
          pumps: getCat(cats: $catName) {
            name
          }
          pomps: getCat(cats: $catName) {
            name
          }
        }
      `
      const filter = buildGraphqlFilter(query)
      expect(filter).toEqual(
        map(['pumps', map('name')], ['pomps', map('name')]),
      )

      expect(
        filter.filter({
          pumps: {
            name: 'Fordads',
            weight: 9_000,
            qualities: [
              {
                qualityName: 'furry',
                loveliness: 60,
                annoying: 10,
              },
            ],
          },
          pomps: {
            name: 'Crawdaddy',
            weight: 9_000,
          },
        }),
      ).toEqual({
        pumps: { name: 'Fordads' },
        pomps: { name: 'Crawdaddy' },
      })
    })

    it('works with aliased field', () => {
      const query = gql`
        query GetCat($catName: String!) {
          getCat {
            knownAs: name
          }
        }
      `
      const filter = buildGraphqlFilter(query)
      expect(filter).toEqual(map(['getCat', map('knownAs')]))
      expect(
        filter.filter({
          getCat: {
            age: 100_000,
            knownAs: 'Tornas',
          },
        }),
      ).toEqual({ getCat: { knownAs: 'Tornas' } })
    })

    it('works with mutation', () => {
      const query = gql`
        mutation SetCat($catName: String!) {
          setCat(cats: $catName) {
            name
          }
        }
      `
      const filter = buildGraphqlFilter(query)
      expect(filter).toEqual(map(['setCat', map('name')]))
    })

    it('works with subscription', () => {
      const query = gql`
        subscription AllCats($catName: String!) {
          allCats(cats: $catName) {
            name
          }
        }
      `
      const filter = buildGraphqlFilter(query)
      expect(filter).toEqual(map(['allCats', map('name')]))
    })

    it('works with fragments', () => {
      const query = gql`
        fragment QualitiesFragment on CatQualities {
          qualityName
          loveliness
        }

        fragment BigCatQualitiesFragment on BigCatQualities {
          qualityName
          fierceness
        }

        query GetCat($catName: String!) {
          getCat(cats: $catName) {
            name
            qualities {
              ...QualitiesFragment
              ...BigCatQualitiesFragment
            }
          }
        }
      `
      const filter = buildGraphqlFilter(query)
      expect(filter).toEqual(
        map([
          'getCat',
          map('name', [
            'qualities',
            mapWithFragments({
              CatQualities: map('qualityName', 'loveliness'),
              BigCatQualities: map('qualityName', 'fierceness'),
            }),
          ]),
        ]),
      )

      expect(
        filter.filter({
          getCat: [
            {
              name: 'Turback',
              weight: 9_000,
              qualities: [
                {
                  __typename: 'BigCatQualities',
                  qualityName: 'furry',
                  loveliness: 60,
                  fierceness: 100,
                  annoying: 10,
                },
                {
                  __typename: 'BigCatQualities',
                  qualityName: 'cuddly',
                  loveliness: 100,
                  fierceness: 19,
                  annoying: 0,
                },
              ],
            },
            {
              name: 'Fluff-hunter',
              weight: 0.1,
              qualities: [
                {
                  __typename: 'CatQualities',
                  qualityName: 'furry',
                  loveliness: 60,
                  fierceness: 27,
                  annoying: 10,
                },
              ],
            },
          ],
        }),
      ).toEqual({
        getCat: [
          {
            name: 'Turback',
            qualities: [
              {
                qualityName: 'furry',
                fierceness: 100,
              },
              {
                qualityName: 'cuddly',
                fierceness: 19,
              },
            ],
          },
          {
            name: 'Fluff-hunter',
            qualities: [
              {
                qualityName: 'furry',
                loveliness: 60,
              },
            ],
          },
        ],
      })
    })
  })
})
