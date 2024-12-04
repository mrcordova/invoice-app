import { hideProgressCircle, showFormErrors, showProgressCircle, URL_WEBSITE  } from "./functions.js";

document.addEventListener("click", async (e) => {
  e.preventDefault();
  const loginBtn = e.target.closest("[data-login]");
  const signUpBtn = e.target.closest("[data-sign-up]");
  const goPage = e.target.closest("[data-page]");

  if (signUpBtn) {
    if (showFormErrors(signUpBtn)) {
      const formData = new FormData(signUpBtn.parentElement);
      const formDataObj = Object.fromEntries(formData.entries());

     const btnText =showProgressCircle(signUpBtn);
      try {
        const response = await fetch(`${URL_WEBSITE}/registerUser`, {
          method: "POST",
          headers: { "Content-type": "application/json" },
          body: JSON.stringify(formDataObj),
          cache: 'reload'
        });
        if (response.ok) {
          signUpBtn.parentElement.reset();
          alert("user successfully registerd");
          location.href = "login.html";
        } else {
          const { message } = await response.json();
          alert(`Error: ${message}`);
        }
      } catch (error) {
        console.error(`Sign up: ${error}`);
      }
      hideProgressCircle(signUpBtn, btnText);
    }
  } else if (loginBtn) {
    if (showFormErrors(loginBtn)) {
      const formData = new FormData(loginBtn.parentElement);
      const formObj = Object.fromEntries(formData.entries());
      const btnText = showProgressCircle(loginBtn);
      
      try {

        // loginBtn.replaceChildren();
        // loginBtn.insertAdjacentHTML('beforeend', `<span class="progress-circle"></span>`);
        const response = await fetch(`${URL_WEBSITE}/loginUser`, {
          method: "POST",
          headers: { "Content-type": "application/json" },
          body: JSON.stringify(formObj),
          cache: 'reload'
        });
        if (response.ok) {
          loginBtn.parentElement.reset();
          const { username, img} = await response.json();
          localStorage.setItem('username', username);
          localStorage.setItem('img', img);

          location.href = "/index.html";
        } else {
          const { message } = await response.json();
          alert(`Error: ${message}`);
        }
        
        // loginBtn.replaceChildren();
        // loginBtn.insertAdjacentText('beforeend', btnText);
        
      } catch (error) {
        console.log(`Login: ${error}`);
      }
      hideProgressCircle(loginBtn, btnText);
    }
  } else if (goPage) {
    location.href = goPage.href;
  }
});
