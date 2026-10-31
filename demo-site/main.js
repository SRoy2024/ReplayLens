const workingButton = document.querySelector("#working-button");
const cartStatus = document.querySelector("#cart-status");

let cartCount = 0;

workingButton.addEventListener("click", () => {
  cartCount += 1;

  cartStatus.textContent = `Items in cart: ${cartCount}`;
});