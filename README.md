# ember-apollo-client

This is an ember-cli addon to integrate [apollo-client][apollo-client] into an
Ember app.

I have been using the non-addon version of this in my own app for a few months.
I've taken care of edge cases around testability and unsubscribing from watch
queries.

## Usage

### Installation

* `ember install ember-apollo-client`

### Configuration

In your app's `config/environment.js`, configure the URL for the GraphQL API:

```js
var ENV = {
  ...
  apollo: {
    apiURL: 'https://test.example/graphql'
  },
  ...
}
```

### Fetching data

The addon makes available an `apollo` service. Inject it into your routes and
you can then use it:

```js
import Ember from 'ember';
import gql from 'graphql-tag';
import UnsubscribeRouteMixin from 'ember-apollo-client/mixins/unsubscribe-route';

export default Ember.Route.extend(UnsubscribeRouteMixin, {
  apollo: Ember.inject.service(),

  model(params) {
    let query = gql`
      query human($id: String!) {
        human(id: $id) {
          name
        }
      }
    `;
    let variables = { id: params.id };
    return this.get('apollo').query({ query, variables }, 'human');
  }
});
```

When you use the `query` method, ember-apollo is actually performing a
`watchQuery` on the ApolloClient. The resulting object is an `Ember.Object` and
therefore has full support for computed properties, observers, etc.

If a subsequent query (such as a mutation) happens to fetch the same data while
this query's subscription is still active, the object will immediately receive
the latest attributes (just like ember-data).

Please note that when using `query`, you should unsubscribe when you're done
with the query data. You can instead use `queryOnce` if you just want a single
query with a POJO response and no watch updates.

See the [API docs](#apollo-service-api)
for more details.

### Mutations and Fragments

You can perform a mutation using the `mutate` method. You can also use GraphQL
fragments in your queries. This is especially useful if you want to ensure that
you refetch the same attributes in a subsequent query or mutation involving the
same model(s).

The following example shows both mutations and fragments in action:

```js
import Ember from 'ember';
import gql from 'graphql-tag';

const ReviewFragment = gql`
  fragment ReviewFragment on Human {
    stars
    commentary
  }
`;

export default Ember.Route.extend({
  apollo: Ember.inject.service(),

  model() {
    return Ember.Object.create({});
  },

  actions: {
    createReview(ep, review) {
      let mutation = gql`
        mutation createReview($ep: Episode!, $review: ReviewInput!) {
          createReview(episode: $ep, review: $review) {
            review {
              ...ReviewFragment
            }
          }
        }

        ${ReviewFragment}
      `;
      let variables = { ep, review };
      return this.get('apollo').mutate({ mutation, variables }, 'review');
    }
  }
});
```

### Apollo service API

The `apollo` service has the following public API:

* `query(options, resultKey)`: This calls the
  [`ApolloClient.watchQuery`](http://dev.apollodata.com/core/apollo-client-api.html#ApolloClient\.watchQuery)
  method. It returns a promise that resolves with an `Ember.Object`. That object
  will be updated whenever the `watchQuery` subscription resolves with new data.
  As before, the `resultKey` can be used to resolve beneath the root.

  When using this method, **it is important to
  [unsubscribe](#unsubscribing-from-watch-queries)** from the query when you're
  done with it.
* `queryOnce(options, resultKey)`: This calls the
  [`ApolloClient.query`](http://dev.apollodata.com/core/apollo-client-api.html#ApolloClient\.query)
  method. It returns a promise that resolves with the raw POJO data that the
  query returns. If you provide a `resultKey`, the resolved data is grabbed from
  that key in the result.
* `mutate(options, resultKey)`: This calls the
  [`ApolloClient.mutate`](http://dev.apollodata.com/core/apollo-client-api.html#ApolloClient\.mutate)
  method. It returns a promise that resolves with the raw POJO data that the
  mutation returns. As with the query methods, the `resultKey` can be used to
  resolve beneath the root.

### Unsubscribing from watch queries

Apollo client's watchQuery will continue to update the query with new data
whenever the store is updated with new data about the resolved objects. This
happens until you explicitly unsubscribe from it.

In ember-apollo-client, this is exposed on the result of `query` via a method
`_apolloUnsubscribe`. You should call this method whenever you're done with the
query. On a route, this can be done with the `deactivate` hook. In a component,
this cleanup is typically done with a `willDestroyElement` hook.

To make this easier on routes, this addon also provides a mixin called
`UnsubscribeRouteMixin`. You can use it in your route like this:

```js
import Ember from 'ember';
import UnsubscribeRouteMixin from 'ember-apollo-client/mixins/unsubscribe-route';

export default Ember.Route.extend(UnsubscribeRouteMixin, {
  model() {
    return this.get('apollo').query(...);
  }
});
```

The mixin will call `_apolloUnsubscribe` on the `model` (if it is set) when the
route deactivates. For now, this only works if your model was resolved directly
from the apollo service. It does not work if your `model` hook returns an
`RSVP.hash` of multiple queries, or something of that sort. You'd have to clean
up manually in that scenario.

### Injecting the apollo service into all routes

The apollo service is not automatically injected into your routes, but you can
do so easily with an initializer like this one:

```js
export function initialize(application) {
  application.inject('route', 'apollo', 'service:apollo');
}

export default {
  name: 'apollo',
  initialize
};
```

### Testing

This addon is very friendly for tests. All promises from the apollo service are
tracked with `Ember.Test.registerWaiter`, so your tests should be completely
deterministic.

The dummy app contains example routes for mutations and queries:

* [Acceptance test for a regular query](https://github.com/bgentry/ember-apollo-client/blob/master/tests/acceptance/main-test.js)
* [Route integration test for a mutation with a fragment](https://github.com/bgentry/ember-apollo-client/blob/master/tests/unit/routes/new-review-test.js)

The tests also contain a sample Star Wars GraphQL schema with an
ember-cli-pretender setup for mock data.

## Development

### Installation

* `git clone https://github.com/bgentry/ember-apollo-client` this repository
* `cd ember-apollo-client`
* `npm install`
* `bower install`

### Running

* `ember serve`
* Visit your app at [http://localhost:4200](http://localhost:4200).

### Running Tests

* `npm test` (Runs `ember try:each` to test your addon against multiple Ember versions)
* `ember test`
* `ember test --server`

### Building

* `ember build`

For more information on using ember-cli, visit [https://ember-cli.com/](https://ember-cli.com/).

[apollo-client]: https://github.com/apollostack/apollo-client
