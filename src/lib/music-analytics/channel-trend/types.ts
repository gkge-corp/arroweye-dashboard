/** Daily activity per channel; null when the channel had no data to read. */
export interface ChannelDay {
  streaming: number | null;
  social: number | null;
  radio: number | null;
}

export interface ChannelTrendPoint extends ChannelDay {
  date: string;
}

export interface StoredChannelTrend {
  /** 2 added Audiomack to streaming; older copies are rebuilt. */
  version: 2;
  /** First and last day the stored points cover without gaps. */
  from: string;
  to: string;
  /** UTC day of the last provider fetch, so unsettled days refresh once a day. */
  fetchedOn: string;
  points: Record<string, ChannelDay>;
}
