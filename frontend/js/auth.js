import { hideProgressCircle, showFormErrors, showProgressCircle, URL_WEBSITE  } from "./functions.js";

function matchPassword(password, repeatPassword) {
  return password === repeatPassword;
}

document.addEventListener("click", async (e) => {
  e.preventDefault();
  const loginBtn = e.target.closest("[data-login]");
  const signUpBtn = e.target.closest("[data-sign-up]");
  const goPage = e.target.closest("[data-page]");
  const guestBtn = e.target.closest('[data-guest]');

  if (signUpBtn) {
    if (showFormErrors(signUpBtn)) {
      const formData = new FormData(signUpBtn.parentElement);
      const formDataObj = Object.fromEntries(formData.entries());
      const { password, 'repeat-password': repeatPassword } = formDataObj;

      if (matchPassword(password, repeatPassword)) {
        
        const btnText = showProgressCircle(signUpBtn);
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
      } else {
        // alert('passoword and repeat password do not match');
        const repeatPasswordInput = signUpBtn.parentElement.querySelector('input[name="repeat-password"]');
        repeatPasswordInput.setCustomValidity('Do not match password');
      }
    };
  } else if (loginBtn) {
    if (showFormErrors(loginBtn)) {
      const formData = new FormData(loginBtn.parentElement);
      const formObj = Object.fromEntries(formData.entries());
      const btnText = showProgressCircle(loginBtn);
      
      try {

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
        };
        
      } catch (error) {
        console.log(`Login: ${error}`);
      };
      hideProgressCircle(loginBtn, btnText);
    };
  } else if (goPage) {
    location.href = goPage.href;
  } else if (guestBtn) {
    const formData = new FormData();
    formData.append('username', 'guest');
    formData.append('password', 'Guest12!');
    const formObj = Object.fromEntries(formData.entries());
    const btnText = showProgressCircle(guestBtn);
    const response = await fetch(`${URL_WEBSITE}/loginUser`, {
          method: "POST",
          headers: { "Content-type": "application/json" },
          body: JSON.stringify(formObj),
      cache: 'reload'
    });
    if (response.ok) {
       const { username, img} = await response.json();
          localStorage.setItem('username', username);
          localStorage.setItem('img', img);
          location.href = "/index.html";
    };
     hideProgressCircle(guestBtn, btnText);
  };
});
