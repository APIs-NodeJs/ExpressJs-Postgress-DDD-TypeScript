import { IUnitOfWork } from '../../application/ports/IUnitOfWork';
import { Result } from '../../domain/Result';
import { Logger } from '../../utils/Logger';

export function Transactional(unitOfWork: IUnitOfWork) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const logger = new Logger('Transaction');

    descriptor.value = async function (...args: any[]) {
      const alreadyInTransaction = unitOfWork.isActive();

      if (alreadyInTransaction) {
        return originalMethod.apply(this, args);
      }

      try {
        await unitOfWork.start();
        logger.debug(`Transaction started for ${propertyName}`);

        const result = await originalMethod.apply(this, args);

        if (result instanceof Result && result.isFailure) {
          await unitOfWork.rollback();
          logger.debug(`Transaction rolled back for ${propertyName}`);
          return result;
        }

        await unitOfWork.commit();
        logger.debug(`Transaction committed for ${propertyName}`);

        return result;
      } catch (error) {
        await unitOfWork.rollback();
        logger.error(`Transaction failed for ${propertyName}`, {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    };

    return descriptor;
  };
}