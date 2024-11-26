import { showFormErrors } from "./functions.js";

const main = document.addEventListener("click", (e) => {
  e.preventDefault();
  const login = e.target.closest("[data-login]");
  const signUp = e.target.closest("[data-sign-up]");
  const goPage = e.target.closest("[data-page]");

  if (signUp) {
    console.log("sign pressed");
    showFormErrors(signUp);
  } else if (login) {
    console.log("login pressed");
    showFormErrors(login);
  } else if (goPage) {
    location.href = goPage.href;
  }
});
