import { showFormErrors, URL } from "./functions.js";

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
        const response = await fetch(`${URL}/registerUser`, {
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
    console.log("login pressed");
    if (showFormErrors(login)) {
      const formData = new FormData(login.parentElement);
      const formObj = Object.fromEntries(formData.entries());
      try {
        const response = await fetch(`${URL}/loginUser`, {
          method: "POST",
          headers: { "Content-type": "application/json" },
          body: JSON.stringify(formObj),
          credentials: "include",
        });
        if (response.ok) {
          login.parentElement.reset();
          const { accessToken } = await response.json();
          localStorage.setItem("accessToken", accessToken);
          // localStorage.setItem("refreshToken", refreshToken);
          location.href = `/index.html`;
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
