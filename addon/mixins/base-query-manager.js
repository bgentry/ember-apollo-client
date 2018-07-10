import { inject as service } from '@ember/service';
import Mixin from '@ember/object/mixin';
import { computed } from '@ember/object';

export default Mixin.create({
  apolloService: service('apollo'),
  init() {
    this._super(...arguments);
    this.set('apollo', this.get('apolloService').createQueryManager());
  },
});
