# graphql-filter-object

[![build status](https://circleci.com/gh/insidewhy/graphql-filter-object.png?style=shield)](https://circleci.com/gh/insidewhy/graphql-filter-object)
[![Known Vulnerabilities](https://snyk.io/test/github/insidewhy/graphql-filter-object/badge.svg)](https://snyk.io/test/github/insidewhy/graphql-filter-object)
[![Renovate](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com)

`graphql-filter-object` is a library that can be used to filter objects and arrays according to a query, subscription or mutation specified via a `gql` object.

## Documentation

```typescript
import buildGraphqlFilter from 'graphql-filter-object'

const objectFilter = buildGraphqlFilter(gql`
  query GetCat($catName: String!) {
    getCat(cats: $catName) {
      name
      qualities {
        qualityName
        loveliness
      }
    }
  }
`)

const filtered = objectFilter.filter({
  getCat: {
    name: 'Mr Onions',
    breed: 'Major Springer',
    qualities: [
      {
        qualityName: 'Cuddliness',
        loveliness: 4_000,
        usefulness: -10,
      },
      {
        qualityName: 'Fighting',
        loveliness: -10,
        usefulness: 20,
      },
    ],
  },
})
```

After running this, `filtered` will equal:

```typescript
const filtered = {
  getCat: {
    name: 'Mr Onions',
    qualities: [
      {
        qualityName: 'Cuddliness',
        loveliness: 4_000,
      },
      {
        qualityName: 'Fighting',
        loveliness: -10,
      },
    ],
  },
}
```

Also supports fragments:

```typescript
import buildGraphqlFilter from 'graphql-filter-object'

const objectFilter = buildGraphqlFilter(
  gql`
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
  `,
)

const filtered = filter.filter({
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
})
```

After running this, `filtered` will equal:

```typescript
const filtered = {
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
}
```
