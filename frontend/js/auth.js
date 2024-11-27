import { showFormErrors, URL } from "./functions.js";

document.addEventListener("click", async (e) => {
  e.preventDefault();
  const login = e.target.closest("[data-login]");
  const signUp = e.target.closest("[data-sign-up]");
  const goPage = e.target.closest("[data-page]");

  if (signUp) {
    console.log("sign pressed");
    if (showFormErrors(signUp)) {
      const formData = new FormData(signUp.parentElement);

      // for (const [key, value] of formData.entries()) {
      //   console.log(`${key}: ${value}`);
      // }
      try {
        const response = await fetch(`${URL}/registerUser`, {
          method: "POST",
          body: formData,
        });
        if (response.ok) {
          console.log("user successfully registerd");
        } else {
        }
      } catch (error) {
        console.error(`Sign up: ${error}`);
      }
    }
  } else if (login) {
    console.log("login pressed");
    if (showFormErrors(login)) {
      const formData = new FormData(login.parentElement);
      try {
        const response = await fetch(`${URL}/login`, {
          method: "POST",
          body: formData,
        });
        if (response.ok) {
          console.log("user successfully logged");
        } else {
        }
      } catch (error) {
        console.log(`Login: ${error}`);
      }
    }
  } else if (goPage) {
    location.href = goPage.href;
  }
});
