import { createLocalVue } from '@vue/test-utils';
import Vuex, { Store } from 'vuex';
import { cloneDeep } from 'lodash';
import { state, mutations, actions, UserState, defaultState } from '../user';

let store: Store<UserState>;

const TEST_ACCESS_TOKEN = 'test-access-token';

beforeEach(() => {
  createLocalVue().use(Vuex);

  store = new Vuex.Store(cloneDeep({ state, mutations, actions }));
});

describe('Vuex: user store', () => {
  it('sets the access token when "SET_USER" is committed', () => {
    store.replaceState({ ...defaultState() });

    store.commit('SET_USER', { accessToken: TEST_ACCESS_TOKEN });

    expect(store.state.accessToken).toBe(TEST_ACCESS_TOKEN);
  });

  it('clears the access token When "CLEAR_USER" is committed', () => {
    store.replaceState({ ...defaultState(), accessToken: TEST_ACCESS_TOKEN });

    store.commit('CLEAR_USER');

    expect(store.state).toMatchObject(defaultState());
  });

  it('sets the access token when setUser is dispatched', () => {
    store.replaceState({ ...defaultState() });

    store.dispatch('setUser', { accessToken: TEST_ACCESS_TOKEN });

    expect(store.state.accessToken).toBe(TEST_ACCESS_TOKEN);
  });

  it('clears the access token when clearUser is dispatched', () => {
    store.replaceState({ ...defaultState(), accessToken: TEST_ACCESS_TOKEN });

    store.dispatch('clearUser');

    expect(store.state).toMatchObject(defaultState());
  });
});
