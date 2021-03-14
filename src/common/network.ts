import errorAdaptors from "./services/errorAdaptors";

export const errorToMessage = err => {
  let errorMessage;
  /**
   * @todo each entry is a route/adpator[] combo and we need to check that this is the relevant
   * route before running the functions
   */
  for (const entry of errorAdaptors) {
    for (const adapderFunction of entry[1]) {
      let result = adapderFunction(err);

      //   @ts-ignore
      if (result) {
        //   @ts-ignore
        errorMessage = result.message;
        break;
      }
    }
  }

  return errorMessage;
};
