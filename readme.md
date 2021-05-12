# graphql-filter-object

[![build status](https://circleci.com/gh/insidewhy/graphql-filter-object.png?style=shield)](https://circleci.com/gh/insidewhy/graphql-filter-object)
[![Known Vulnerabilities](https://snyk.io/test/github/insidewhy/graphql-filter-object/badge.svg)](https://snyk.io/test/github/insidewhy/graphql-filter-object)
[![Renovate](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com)

`graphql-filter-object` is a library that can be used to filter objects and arrays according to a query, subscription or mutation specified via a `gql` object.

## Documentation

```typescript
import { buildGraphqlFilter, applyGraphqlFilter } from 'graphql-filter-object'

const filter = buildGraphqlFilter(gql`
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

const filtered = applyGraphqlFilter(filter, {
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
  }
})
```

After running this, `filtered` will equal:

```typescript
{
  getCat: {
    name: "Mr Onions",
    qualities: [
      {
        qualityName: "Cuddliness",
        loveliness: 4_000,
      },
      {
        qualityName: "Fighting",
        loveliness: -10,
      },
    ]
  }
}
```
