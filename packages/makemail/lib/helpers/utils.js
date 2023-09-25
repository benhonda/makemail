import _ from "lodash";
export function parseEnvBoolWithArgv(_default, argv, env) {
    if (_.isBoolean(argv))
        return argv;
    if (_.isString(argv))
        return argv === env;
    if (_.isBoolean(_default))
        return _default;
    if (_.isString(_default))
        return _default === env;
    return false;
}
//# sourceMappingURL=utils.js.map