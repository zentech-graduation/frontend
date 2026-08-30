import { axiosClient, publicClient } from '@/api/axiosClient';
import { buildBody, pickParams } from '@/utils/requestContract';

/**
 * The help centre's calls.
 *
 * Two clients, deliberately. The authenticated half uses axiosClient, which
 * injects the bearer token and refreshes on 401. The three anonymous calls use
 * publicClient, which does neither: the accounts those exist for cannot
 * authenticate at all, so attaching a token or attempting a refresh would be a
 * request certain to fail.
 *
 * Every call declares its own key list through pickParams and buildBody, the
 * same contract the panel obeys, because the backend rejects an undeclared
 * query parameter or body field with a 400.
 */
export const supportApi = {
  /** The caller's own tickets, newest first. */
  async listOwnTickets(params) {
    const { data } = await axiosClient.get('/support/tickets', {
      params: pickParams(params, ['limit']),
    });
    return data.data;
  },

  /** One of the caller's own tickets. */
  async getOwnTicket(ticketId) {
    const { data } = await axiosClient.get(`/support/tickets/${ticketId}`);
    return data.data;
  },

  /** Opens a ticket for the authenticated account. */
  async createTicket({ category, subject, body }) {
    const { data } = await axiosClient.post(
      '/support/tickets',
      buildBody({ category, subject, body })
    );
    return data.data;
  },

  /**
   * Redeems the single-use link from a moderation notice.
   *
   * publicClient, and no category field: the category travels inside the token,
   * and this call mints no session, so nothing here touches the auth store.
   */
  async createAppeal({ token, subject, body }) {
    const { data } = await publicClient.post(
      '/support/appeal',
      buildBody({ token, subject, body })
    );
    return data.data;
  },

  /** Submits the public form. Returns nothing; the ticket is not real until confirmed. */
  async createPublicTicket({ contactEmail, category, subject, body, turnstileToken }) {
    const { data } = await publicClient.post(
      '/support/public/tickets',
      buildBody({ contactEmail, category, subject, body, turnstileToken })
    );
    return data.data;
  },

  /** Confirms a public submission and moves it into the staff queue. */
  async confirmPublicTicket(token) {
    const { data } = await publicClient.post('/support/public/confirm', null, {
      params: pickParams({ token }, ['token']),
    });
    return data.data;
  },

  /** Opts the account behind the token out of campaign mail. */
  async unsubscribe(token) {
    const { data } = await publicClient.post('/support/unsubscribe', null, {
      params: pickParams({ token }, ['token']),
    });
    return data.data;
  },

  /** The shared vocabulary, read for its support category list. */
  async listVocabularies() {
    const { data } = await publicClient.get('/config/vocabularies');
    return data.data;
  },
};

export default supportApi;
