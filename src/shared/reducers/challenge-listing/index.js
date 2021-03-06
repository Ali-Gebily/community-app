/**
 * Reducer for state.challengeListing.
 */

/* global window */

import _ from 'lodash';
import actions from 'actions/challenge-listing';
import logger from 'utils/logger';
import qs from 'qs';
import { handleActions } from 'redux-actions';
import { combine } from 'utils/redux';

import filterPanel from '../challenge-listing/filter-panel';
import sidebar from '../challenge-listing/sidebar';

function onGetAllActiveChallengesDone(state, { error, payload }) {
  if (error) {
    logger.error(payload);
    return state;
  }
  const { uuid, challenges: loaded } = payload;
  if (uuid !== state.loadingActiveChallengesUUID) return state;

  /* Once all active challenges are fetched from the API, we remove from the
   * store any active challenges stored there previously, and also any
   * challenges with IDs matching any challenges loaded now as active. */
  const ids = new Set();
  loaded.forEach(item => ids.add(item.id));
  const challenges = state.challenges
  .filter(item => item.status !== 'ACTIVE' && !ids.has(item.id))
  .concat(loaded);

  return {
    ...state,
    challenges,
    lastUpdateOfActiveChallenges: Date.now(),
    loadingActiveChallengesUUID: '',
  };
}

function onGetAllActiveChallengesInit(state, { payload }) {
  return { ...state, loadingActiveChallengesUUID: payload };
}

/**
 * Handles CHALLENGE_LISTING/GET_CHALLENGE_SUBTRACKS_DONE action.
 * @param {Object} state
 * @param {Object} action
 * @return {Object}
 */
function onGetChallengeSubtracksDone(state, action) {
  if (action.error) logger.error(action.payload);
  return {
    ...state,
    challengeSubtracks: action.error ? [] : action.payload,
    loadingChallengeSubtracks: false,
  };
}

/**
 * Handles CHALLENGE_LISTING/GET_CHALLENGE_TAGS_DONE action.
 * @param {Object} state
 * @param {Object} action
 * @return {Object}
 */
function onGetChallengeTagsDone(state, action) {
  if (action.error) logger.error(action.payload);
  return {
    ...state,
    challengeTags: action.error ? [] : action.payload,
    loadingChallengeTags: false,
  };
}

function onGetCommunityFitlers(state, { error, payload }) {
  let communityFilters = [{
    id: '',
    name: 'All',
  }];
  if (error) logger.error(payload);
  else communityFilters = communityFilters.concat(payload);
  return { ...state, communityFilters };
}

function onGetDraftChallengesInit(state, { payload: { uuid, page } }) {
  return {
    ...state,
    lastRequestedPageOfDraftChallenges: page,
    loadingDraftChallengesUUID: uuid,
  };
}

function onGetDraftChallengesDone(state, { error, payload }) {
  if (error) {
    logger.error(payload);
    return state;
  }
  const { uuid, challenges: loaded } = payload;
  if (uuid !== state.loadingDraftChallengesUUID) return state;

  const ids = new Set();
  loaded.forEach(item => ids.add(item.id));

  /* Fetching 0 page of draft challenges also drops any draft challenges
   * loaded to the state before. */
  const filter = state.lastRequestedPageOfDraftChallenges
    ? item => !ids.has(item.id)
    : item => !ids.has(item.id) && item.status !== 'DRAFT';

  const challenges = state.challenges
  .filter(filter).concat(loaded);

  return {
    ...state,
    allDraftChallengesLoaded: loaded.length === 0,
    challenges,
    loadingDraftChallengesUUID: '',
  };
}

function onGetPastChallengesInit(state, { payload: { uuid, page } }) {
  return {
    ...state,
    lastRequestedPageOfPastChallenges: page,
    loadingPastChallengesUUID: uuid,
  };
}

function onGetPastChallengesDone(state, { error, payload }) {
  if (error) {
    logger.error(payload);
    return state;
  }
  const { uuid, challenges: loaded } = payload;
  if (uuid !== state.loadingPastChallengesUUID) return state;

  const ids = new Set();
  loaded.forEach(item => ids.add(item.id));

  /* Fetching 0 page of past challenges also drops any past challenges
   * loaded to the state before. */
  const filter = state.lastRequestedPageOfPastChallenges
    ? item => !ids.has(item.id)
    : item => !ids.has(item.id) && item.status !== 'COMPLETED' && item.status !== 'PAST';

  const challenges = state.challenges.filter(filter).concat(loaded);

  return {
    ...state,
    allPastChallengesLoaded: loaded.length === 0,
    challenges,
    loadingPastChallengesUUID: '',
  };
}

/**
 * @param {Object} state
 * @param {Object} action
 * @return {Object}
 */
function onSetFilter(state, { payload }) {
  if (window) {
    let query = qs.parse(window.location.search.slice(1));
    query.filter = payload;
    query = `?${qs.stringify(query, { encode: false })}`;
    window.history.replaceState(window.history.state, '', query);
  }

  return {
    ...state,
    filter: payload,
  };
}

/**
 * Creates a new Challenge Listing reducer with the specified initial state.
 * @param {Object} initialState Optional. Initial state.
 * @return Challenge Listing reducer.
 */
function create(initialState) {
  const a = actions.challengeListing;
  return handleActions({
    [a.dropChallenges]: state => ({
      ...state,
      allDraftChallengesLoaded: false,
      allPastChallengesLoaded: false,
      challenges: [],
      lastRequestedPageOfDraftChallenges: -1,
      lastRequestedPageOfPastChallenges: -1,
      lastUpdateOfActiveChallenges: 0,
      loadingActiveChallengesUUID: '',
      loadingDraftChallengesUUID: '',
      loadingPastChallengesUUID: '',
    }),

    [a.getAllActiveChallengesInit]: onGetAllActiveChallengesInit,
    [a.getAllActiveChallengesDone]: onGetAllActiveChallengesDone,

    [a.getChallengeSubtracksInit]: state => ({
      ...state,
      loadingChallengeSubtracks: true,
    }),
    [a.getChallengeSubtracksDone]: onGetChallengeSubtracksDone,

    [a.getChallengeTagsInit]: state => ({
      ...state,
      loadingChallengeTags: true,
    }),
    [a.getChallengeTagsDone]: onGetChallengeTagsDone,

    [a.getCommunityFilters]: onGetCommunityFitlers,

    [a.getDraftChallengesInit]: onGetDraftChallengesInit,
    [a.getDraftChallengesDone]: onGetDraftChallengesDone,

    [a.getPastChallengesInit]: onGetPastChallengesInit,
    [a.getPastChallengesDone]: onGetPastChallengesDone,

    [a.selectCommunity]: (state, { payload }) => ({
      ...state, selectedCommunityId: payload,
    }),

    [a.setFilter]: onSetFilter,
    [a.setSort]: (state, { payload }) => ({
      ...state,
      sorts: {
        ...state.sorts,
        [payload.bucket]: payload.sort,
      },
    }),
  }, _.defaults(_.clone(initialState) || {}, {
    allDraftChallengesLoaded: false,
    allPastChallengesLoaded: false,

    challenges: [],
    challengeSubtracks: [],
    challengeTags: [],

    communityFilters: [{
      id: '',
      name: 'All',
    }],

    filter: {},

    lastRequestedPageOfDraftChallenges: -1,
    lastRequestedPageOfPastChallenges: -1,
    lastUpdateOfActiveChallenges: 0,

    loadingActiveChallengesUUID: '',
    loadingDraftChallengesUUID: '',
    loadingPastChallengesUUID: '',

    loadingChallengeSubtracks: false,
    loadingChallengeTags: false,

    selectedCommunityId: '',

    sorts: {},
  }));
}

/**
 * The factory creates the new reducer with initial state tailored to the given
 * ExpressJS HTTP request, if specified (for server-side rendering). If no HTTP
 * request is specified, it creates the default reducer.
 * @param {Object} req Optional. ExpressJS HTTP request.
 * @return {Promise} Resolves to the new reducer.
 */
export function factory(req) {
  const state = {};

  if (req) {
    state.filter = req.query.filter;
  }

  /* Server-side rendering is not implemented yet.
    Let's first ensure it all works fine without it. */
  return Promise.resolve(combine(create(state), { filterPanel, sidebar }));
}

/* Default reducer with empty initial state. */
export default combine(create(), { filterPanel, sidebar });
