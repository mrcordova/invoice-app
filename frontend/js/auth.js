import { showFormErrors, URL_WEBSITE  } from "./functions.js";

document.addEventListener("click", async (e) => {
  e.preventDefault();
  const login = e.target.closest("[data-login]");
  const signUp = e.target.closest("[data-sign-up]");
  const goPage = e.target.closest("[data-page]");

  if (signUp) {
    if (showFormErrors(signUp)) {
      const formData = new FormData(signUp.parentElement);
      const formDataObj = Object.fromEntries(formData.entries());

      try {
        const response = await fetch(`${URL_WEBSITE}/registerUser`, {
          method: "POST",
          headers: { "Content-type": "application/json" },
          body: JSON.stringify(formDataObj),
        });
        if (response.ok) {
          signUp.parentElement.reset();
          alert("user successfully registerd");
          location.href = "login.html";
        } else {
          const { message } = await response.json();
          alert(`Error: ${message}`);
        }
      } catch (error) {
        console.error(`Sign up: ${error}`);
      }
    }
  } else if (login) {
    if (showFormErrors(login)) {
      const formData = new FormData(login.parentElement);
      const formObj = Object.fromEntries(formData.entries());
      try {
        const response = await fetch(`${URL_WEBSITE}/loginUser`, {
          method: "POST",
          headers: { "Content-type": "application/json" },
          body: JSON.stringify(formObj),
          credentials: "same-origin",
        });
        if (response.ok) {
          login.parentElement.reset();
          const { username, img} = await response.json();
          localStorage.setItem('username', username);
          localStorage.setItem('img', img);

          location.href = "/index.html";
        } else {
          const { message } = await response.json();
          alert(`Error: ${message}`);
        }
      } catch (error) {
        console.log(`Login: ${error}`);
      }
    }
  } else if (goPage) {
    location.href = goPage.href;
  }
});
