/**
 * Created by PIV on 17.06.2016.
 */
import Joi from 'joi';

export const schemaOptsWithSockets =
  Joi
    .object({
      socket: Joi
        .object()
        .required(),
      self: Joi
        .object({
          nodeId: Joi
            .string()
            .guid()
            .required(),
          nodeWeight: Joi
            .number()
            .required()
        })
        .required()
    })
    .required()
    .unknown();

export const schemaOptsWithFutureConnection =
  Joi
    .object({
      self: Joi
        .object({
          nodeId: Joi
            .string()
            .guid()
            .required(),
          nodeWeight: Joi
            .number()
            .required()
        }),
      remote: Joi
        .object({
          nodeId: Joi
            .string()
            .guid()
            .required(),
          nodeWeight: Joi
            .number()
            .required(),
          promote: Joi
            .object()
            .keys({
              port: Joi
                .number()
                .min(1)
                .max(64999)
                .required(),
              proto: Joi
                .string()
                .required()
            })
            .required()
            .unknown(),
          ips: Joi
            .array()
            .items(Joi
              .string()
              .ip({ version: ['ipv4'] })
              .required())
        })
    })
    .required()
    .unknown();
