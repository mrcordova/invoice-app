import {
  addItemRow,
  resetForm,
  saveInvoice,
  showPaymentTermsMenu,
  updatePaymentTerms,
  perferredColorScheme,
  themeUpdate,
  refreshAccessToken,
  fetchWithAuth,
  logout,
  showFormErrors,
  acceptedFileTypes,
  showProgressCircle,
  hideProgressCircle,
  showOverlayLoading,
  hideOverlayLoading,
  copyUrl,
  updateInvoice,
  updateStatus,
  setUpEditDialog,
} from "./functions.js";
let params = new URLSearchParams(document.location.search);
const loadingOverlay = document.getElementById("overlay");
const invoiceId = params.get("invoice-id");
showOverlayLoading(loadingOverlay);
let invoice = await getInvoice(invoiceId);
hideOverlayLoading(loadingOverlay);
async function getInvoice(invoiceId) {
  let response;
  try {
    response = await fetchWithAuth(`/getInvoice/${invoiceId}`, "GET");
    if (response.status === 403) {
      await refreshAccessToken();

      return await getInvoice(invoiceId);
    } else {
      return await response.json();
    }
  } catch (error) {
    console.error(`getInvoice: ${error}`);
  }
}
const deleteDialog = document.querySelector("#delete-dialog");
const editDialog = document.querySelector("#edit-invoice-dialog");
const body = document.querySelector("body");
const statusBarEle = document.querySelector("[data-status-bar]");
const invoiceEle = document.querySelector("[data-invoice]");
const invoiceItemsTable = document.querySelector(".invoice-table-cont");
const amountDue = document.querySelector("[data-amount-due]");
const profileDialog = document.getElementById("profile-dialog");
const shareDialog = document.getElementById("share-dialog");
const shareOverlay = shareDialog.querySelector("#share-overlay");
let username = localStorage.getItem("username");
let img = localStorage.getItem("img");
const profileImgs = document.querySelectorAll(".profile_img");
for (const profileImg of profileImgs) {
  profileImg.src = img;
}
const fileInput = document.getElementById("profile_pic");

const homePage = "/index.html";
const themeInputs = document.querySelectorAll('label:has(input[name="theme"])');

if (!(perferredColorScheme in localStorage)) {
  localStorage.setItem(
    perferredColorScheme,
    window.matchMedia("(prefers-color-scheme: dark)").matches ? true : ""
  );
}
for (const themeInput of themeInputs) {
  const input = themeInput.querySelector("input");
  input.checked = localStorage.getItem(perferredColorScheme);
}

updateStatus(invoice, statusBarEle);
updateInvoice(invoice, invoiceEle, invoiceItemsTable, amountDue);
fileInput.addEventListener("change", (e) => {
  if (
    e.target.files.length === 1 &&
    acceptedFileTypes.includes(fileInput.files[0].type) &&
    e.target.files[0].size < 2097152
  ) {
    const file = e.target.files[0];
    const thumbUrl = URL.createObjectURL(file);
    const imgPreview = profileDialog.querySelector("img[data-preview]");
    imgPreview.setAttribute("src", thumbUrl);
    imgPreview.setAttribute("title", file.name);
    imgPreview.setAttribute("alt", file.name);
  } else {
    console.log("file does not meet requirements");
    console.error(e.target.files);
  }
});
body.addEventListener("click", async (e) => {
  const deleteDialogTarget = e.target.closest("[data-show-delete-dialog]");
  const editDialogTarget = e.target.closest("[data-show-edit-dialog]");
  const goBackBtn = e.target.closest("[data-go-back]");
  const goBackPageBtn = e.target.closest("[data-go-back-page]");
  const markAsPaidBtn = e.target.closest("[data-mark-status-paid]");
  const themeBtn = e.target.closest("[data-theme]");
  const closeDeleteDialog = e.target.closest("[data-close-delete-dialog]");
  const deleteInvoiceBtn = e.target.closest("[delete-invoice]");
  const deleteItemBtn = e.target.closest("[data-delete-item]");
  const addItemBtn = e.target.closest("[data-add-item]");
  const paymentTermsBtn = e.target.closest("[data-payment-terms-option]");
  const paymentTermInput = e.target.closest("[data-payment-terms-input]");
  const saveChangesBtn = e.target.closest("[data-save]");

  const profileDialogAttr = e.target.closest("[data-show-profile-dialog]");
  const closeBtn = e.target.closest("[data-close]");
  const submtiBtn = e.target.closest("[data-profile-submit]");
  const logoutBtn = e.target.closest("[data-logout]");

  const shareDialogBtn = e.target.closest("[data-share]");
  const closeShareDialogBtn = e.target.closest("[data-close-share]");
  const copyBtn = e.target.closest("[data-copy]");

  if (deleteDialogTarget) {
    deleteDialog.showModal();
    const deleteId = deleteDialog.querySelector("[data-invoice-id]");
    deleteId.textContent = `#${invoiceId}`;
  } else if (editDialogTarget) {
    setUpEditDialog(editDialog, invoice);
  } else if (goBackBtn) {
    history.back();
  } else if (markAsPaidBtn) {
    e.preventDefault();
    const statusEle = statusBarEle.querySelector("[data-status]");
    const statusText = statusEle.querySelector("[data-status-text]");
    const status =
      statusEle.dataset.status == "pending" ? "paid" : statusEle.dataset.status;
    if (status !== statusEle.dataset.status) {
      let response;
      const btnText = showProgressCircle(markAsPaidBtn);
      try {
        const jsonStatus = JSON.stringify({ status });
        response = await fetchWithAuth(
          `/updateStatus/${invoiceId}`,
          "PUT",
          jsonStatus
        );
        if (response.status === 403) {
          await refreshAccessToken();

          response = await fetchWithAuth(
            `/updateStatus/${invoiceId}`,
            "PUT",
            jsonStatus
          );
        }
        invoice.status = status;
      } catch (error) {
        console.error(`Status Update: ${error}`);
      }
      hideProgressCircle(markAsPaidBtn, btnText);
    }
    statusEle.setAttribute("data-status", status);
    statusText.textContent = status;
  } else if (themeBtn) {
    e.preventDefault();
    themeUpdate(e, themeInputs);
  } else if (closeDeleteDialog) {
    deleteDialog.close();
  } else if (goBackPageBtn) {
    e.preventDefault();
    resetForm(editDialog);
  } else if (deleteInvoiceBtn) {
    e.preventDefault();
    let response;
    const btnText = showProgressCircle(deleteInvoiceBtn);
    try {
      response = await fetchWithAuth(`/deleteInvoice/${invoiceId}`, "DELETE");
      if (response.status === 403) {
        await refreshAccessToken();

        response = await fetchWithAuth(`/deleteInvoice/${invoiceId}`, "DELETE");
      }
      const { success } = await response.json();
      if (response.ok && success) {
        history.back();
      }
    } catch (error) {
      console.error(`Delete Invoice: ${error}`);
    }
    hideProgressCircle(deleteInvoiceBtn, btnText);
  } else if (deleteItemBtn) {
    e.preventDefault();
    deleteItemBtn.parentElement.remove();
  } else if (addItemBtn) {
    e.preventDefault();
    addItemRow(addItemBtn);
  } else if (paymentTermsBtn) {
    e.preventDefault();
    updatePaymentTerms(paymentTermsBtn);
  } else if (paymentTermInput) {
    e.preventDefault();
    showPaymentTermsMenu(paymentTermInput);
  } else if (saveChangesBtn) {
    e.preventDefault();
    const invoiceForm = editDialog.querySelector("#invoice-form");
    if (invoiceForm.checkValidity()) {
      let response;
      const btnText = showProgressCircle(saveChangesBtn);
      showOverlayLoading(loadingOverlay);
      try {
        const tempInvoice = saveInvoice(
          editDialog,
          invoice.status === "draft" ? "pending" : invoice.status,
          invoice.id
        );
        statusBarEle.replaceChildren();
        invoiceEle.childNodes[0].remove();
        invoiceItemsTable.replaceChildren();

        const jsonInvoice = JSON.stringify(tempInvoice);
        response = await fetchWithAuth(
          `/updateInvoice/${invoiceId}`,
          "POST",
          jsonInvoice
        );
        if (response.status === 403) {
          await refreshAccessToken();

          response = await fetchWithAuth(
            `/updateInvoice/${invoiceId}`,
            "POST",
            jsonInvoice
          );
        }
        tempInvoice.senderAddress = JSON.stringify(tempInvoice.senderAddress);
        tempInvoice.clientAddress = JSON.stringify(tempInvoice.clientAddress);
        tempInvoice.items = JSON.stringify(tempInvoice.items);
        updateStatus(tempInvoice, statusBarEle);

        updateInvoice(tempInvoice, invoiceEle, invoiceItemsTable, amountDue);

        invoice = tempInvoice;
      } catch (error) {
        console.error(`update invoice: ${error}`);
      }
      hideProgressCircle(saveChangesBtn, btnText);
      hideOverlayLoading(loadingOverlay);
    } else {
      invoiceForm.reportValidity();
      invoiceForm.requestSubmit(saveChangesBtn);
    }
  } else if (profileDialogAttr) {
    profileDialog.showModal();
    profileDialog.querySelector('input[name="username"]').value = username;
    const imgPreview = profileDialog.querySelector("img[data-preview]");
    imgPreview.src = localStorage.getItem("img");
  } else if (closeBtn) {
    const imgPreview = profileDialog.querySelector("img[data-preview]");
    imgPreview.src = localStorage.getItem("img");
    document.querySelector("#profile-form").reset();
    profileDialog.close();
  } else if (submtiBtn) {
    e.preventDefault();

    const input = profileDialog.querySelector('input[name="username"]');

    if (
      showFormErrors(submtiBtn) &&
      (fileInput.files.length === 1 || input.value !== username) &&
      input.value.length != 0
    ) {
      const formData = new FormData(document.querySelector("#profile-form"));
      let response;
      const btnText = showProgressCircle(submtiBtn);
      try {
        response = await fetchWithAuth("/upload", "POST", formData, {});
        if (response.status === 403) {
          await refreshAccessToken();
          response = await fetchWithAuth("/upload", "POST", formData, {});
        }
        if (response.ok) {
          const result = await response.json();
          if (result["success"]) {
            const { filename, alt, title } = result["file"];
            const { username: newUsername } = result;
            for (const profileImg of profileImgs) {
              profileImg.src = `${filename}`;
              profileImg.setAttribute("title", title);
              profileImg.setAttribute("alt", alt);
            }

            fileInput.value = "";
            localStorage.setItem("img", filename);
            localStorage.setItem("username", newUsername);
            username = newUsername;
          } else {
            console.error(result);
          }
        }
      } catch (error) {
        console.error(`upload on frontend: ${error}`);
      }
      hideProgressCircle(submtiBtn, btnText);
    } else {
      const form = submtiBtn.closest("form");
      form.requestSubmit(submtiBtn);
    }
  } else if (logoutBtn) {
    e.preventDefault();

    const btnText = showProgressCircle(logoutBtn);
    const result = await logout();
    hideProgressCircle(logoutBtn, btnText);
    if (result.success) {
      document.cookie =
        "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      document.cookie =
        "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    }
  } else if (shareDialogBtn) {
    showOverlayLoading(shareOverlay);
    shareDialog.showModal();
    let response;
    try {
      response = await fetchWithAuth(
        `/create-room/${invoice.id}?num_of_guests=1`
      );
      if (response.status === 403) {
        await refreshAccessToken();
        response = await fetchWithAuth(
          `/create-room/${invoice.id}?num_of_guests=1`
        );
      }
      if (response.ok) {
        const result = await response.json();
        if (result["success"]) {
          const { link, path } = result;
          const joinRoomLink = shareDialog.querySelector("[data-join]");
          const displayLink = shareDialog.querySelector("[data-display-link]");
          const copyBtn = shareDialog.querySelector("[data-copy]");
          displayLink.textContent = `${link}`;
          copyBtn.setAttribute("data-copy", `${link}`);
          joinRoomLink.setAttribute("href", path);
        } else {
          console.error(result);
        }
      }
    } catch (error) {
      console.error(`share link: ${error}`);
    }
    hideOverlayLoading(shareOverlay);
  } else if (closeShareDialogBtn) {
    shareDialog.close();
  } else if (copyBtn) {
    const linkText = copyBtn.dataset.copy;
    await copyUrl(linkText);
    const feedback = document.getElementById("copyFeedback");
    feedback.style.visibility = "visible";

    // Hide feedback after 2 seconds
    setTimeout(() => {
      feedback.style = "";
    }, 1000);
  }
});
