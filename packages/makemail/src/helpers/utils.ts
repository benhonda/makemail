import _ from "lodash";
import { EnvBool } from "../@types/types.js";

export function parseEnvBoolWithArgv(_default: EnvBool, argv: any, env: EnvBool): boolean {
  if (_.isBoolean(argv)) return argv;
  if (_.isString(argv)) return argv === env;

  if (_.isBoolean(_default)) return _default;
  if (_.isString(_default)) return _default === env;

  return false;
}
