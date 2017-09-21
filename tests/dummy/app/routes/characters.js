import Ember from 'ember';
import RouteQueryManager from 'ember-apollo-client/mixins/route-query-manager';
import query from 'dummy/gql/queries/characters';

export default Ember.Route.extend(RouteQueryManager, {
  queryParams: {
    kind: {
      refreshModel: true
    }
  },

  model(variables) {
    return this.apollo.watchQuery({ query, variables }, 'characters');
  }
});
