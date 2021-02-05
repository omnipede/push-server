import { ArgumentMetadata, PipeTransform } from '@nestjs/common';
import { ObjectSchema } from 'joi';
import { ErrorCode, SystemException } from './error';

export class JoiValidationPipe implements PipeTransform {

  constructor(private schema: ObjectSchema) {}

  transform(value: any, metadata: ArgumentMetadata): any {
    const { error } = this.schema.validate(value);
    if (error) {
      throw new SystemException(ErrorCode.InvalidBody, error.details);
    }
    return value;
  }
}
