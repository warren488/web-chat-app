export default new Map([
  [
    "login",
    [
      function(err) {
        console.log(err.response);

        if (
          err.response &&
          err.response.status === 401 &&
          err.response.data.message === "incorrect credentials"
        ) {
          return {
            found: true,
            message: "please enter the correct username and password"
          };
        } else if (
          err.response.status === 404 &&
          err.response.data.message === "user not found"
        ) {
          return { found: true, message: "User not found" };
        }
        return false;
      },
      function(err) {}
    ]
  ],
  [
    "any",
    [
      function name(error) {
        if (
          error.response &&
          error.response.data &&
          error.response.data.userMessage
        ) {
          return {
            found: true,
            message: error.response.data.userMessage
          };
        }
      }
    ]
  ]
]);
