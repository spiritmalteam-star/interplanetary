/** One natural biological ingredient of the healing apothecary catalogue. */
export interface RemedyIngredient {
  /** The catalogue name, e.g. "Silver chamomile flower". */
  name: string;
  /** The botanical kind — herb, flower, root, bark, seed, resin… */
  kind: string;
  /** Two or three gentle actions this ingredient is known for. */
  actions: string[];
  /** The preparation this ingredient suits best. */
  affinity: string;
  /** One quiet line about how it is gathered and kept. */
  note: string;
}
