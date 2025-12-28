export interface IMapper<TDomain, TDTO, TPersistence = any> {
  toDomain(raw: TPersistence): TDomain;
  toDTO(domain: TDomain): TDTO;
  toPersistence(domain: TDomain): TPersistence;
}

export abstract class BaseMapper<TDomain, TDTO, TPersistence>
  implements IMapper<TDomain, TDTO, TPersistence> {
  abstract toDomain(raw: TPersistence): TDomain;
  abstract toDTO(domain: TDomain): TDTO;
  abstract toPersistence(domain: TDomain): TPersistence;

  toDomainList(rawList: TPersistence[]): TDomain[] {
    return rawList.map(raw => this.toDomain(raw));
  }

  toDTOList(domainList: TDomain[]): TDTO[] {
    return domainList.map(domain => this.toDTO(domain));
  }

  toPersistenceList(domainList: TDomain[]): TPersistence[] {
    return domainList.map(domain => this.toPersistence(domain));
  }
}