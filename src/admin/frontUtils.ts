export const sortBlocsByOrder = <T extends { order: number }>(blocs: T[]): T[] =>
  [...blocs].sort((a, b) => a.order - b.order);
