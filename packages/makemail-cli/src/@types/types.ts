export type Config = {
  _defaultIndexFile: string;
  dirs: {
    templates: string;
    assets: string;
    output: string;
  };
  watch: string[];
  // watchDirs: (keyof Config["dirs"])[]; // watchDirs can be empty or the name of Config.dirs
  browserSync?: {
    open: boolean;
    // TODO: add more options
  };
};
