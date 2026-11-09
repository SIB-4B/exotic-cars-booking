document.addEventListener('DOMContentLoaded', () => {
    // Car rates mapping
    const carRates = {
        'lamborghini': 500,
        'mclaren': 750,
        'rollsroyce': 750,
        'mercedes': 600,
        'ferrari': 800,
        'aston': 650
    };

    let activePreference = 'none';

    // 1. Input Listeners
    const allInputs = Array.from(document.querySelectorAll('#basic-info-form input, .dealership-details input, .delivery-details input, #car-select'));
    
    allInputs.forEach(input => {
        input.addEventListener('input', () => {
            calculateRentalAndBill();
        });
        input.addEventListener('change', () => {
            calculateRentalAndBill();
        });
    });

    const carSelect = document.getElementById('car-select');
    carSelect.value = "";

    // 2. Reset Buttons
    const resetButtons = document.querySelectorAll('.reset-btn');
    resetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const targetInput = document.getElementById(targetId);
            if (targetInput) {
                targetInput.value = '';
                calculateRentalAndBill();
            }
        });
    });

    // 3. Screenshot Upload Trigger
    const uploadTrigger = document.getElementById('upload-trigger');
    const paymentFileInput = document.getElementById('payment-file-input');
    const uploadText = document.getElementById('upload-text');

    if (uploadTrigger && paymentFileInput) {
        uploadTrigger.addEventListener('click', () => {
            paymentFileInput.click();
        });

        paymentFileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const fileName = e.target.files[0].name;
                uploadText.textContent = `Attached: ${fileName}`;
            }
        });
    }

    // 4. Keyboard Navigation
    const textInputs = Array.from(document.querySelectorAll('#basic-info-form input, .delivery-details input[type="text"]'));
    textInputs.forEach((input, index) => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (index < textInputs.length - 1) {
                    const nextInput = textInputs[index + 1];
                    nextInput.focus();
                    nextInput.setSelectionRange(nextInput.value.length, nextInput.value.length);
                }
            }

            if (e.key === 'Backspace') {
                const isCursorAtStart = input.selectionStart === 0 && input.selectionEnd === 0;
                if (isCursorAtStart && index > 0) {
                    e.preventDefault();
                    const prevInput = textInputs[index - 1];
                    prevInput.focus();
                    const len = prevInput.value.length;
                    prevInput.setSelectionRange(len, len);
                }
            }
        });
    });

    // 5. Rental Calculation & Bill Unlock / Auto-Expand Logic
    const billCard = document.getElementById('bill-card');
    const billRent = document.getElementById('bill-rent');
    const billDeliveryFee = document.getElementById('bill-delivery-fee');
    const billPayable = document.getElementById('bill-payable');

    let currentRentalDays = 0;

    function calculateRentalAndBill() {
        let startVal = '';
        let endVal = '';
        let deliveryFee = 0;

        if (activePreference === 'dealership') {
            startVal = document.getElementById('dealership-pickup').value;
            endVal = document.getElementById('dealership-dropoff').value;
            deliveryFee = 0; // $0 for dealership pickup
        } else if (activePreference === 'delivery') {
            startVal = document.getElementById('delivery-pickup').value;
            endVal = document.getElementById('delivery-dropoff').value;
            deliveryFee = 50; // $50 for delivery
        }

        const dDisplay = document.getElementById('dealership-period');
        const delDisplay = document.getElementById('delivery-period');

        let periodValid = false;
        currentRentalDays = 0;

        if (activePreference !== 'none' && startVal && endVal) {
            const startDate = new Date(startVal);
            const endDate = new Date(endVal);
            const diffMs = endDate - startDate;

            if (diffMs > 0) {
                const totalHours = diffMs / (1000 * 60 * 60);
                currentRentalDays = totalHours / 24;

                const diffDays = Math.floor(totalHours / 24);
                const diffHoursRem = Math.floor(totalHours % 24);

                let text = '';
                if (diffDays > 0) text += `${diffDays} Day${diffDays > 1 ? 's' : ''} `;
                if (diffHoursRem > 0 || diffDays === 0) text += `${diffHoursRem} Hour${diffHoursRem > 1 ? 's' : ''}`;

                if (activePreference === 'dealership') {
                    dDisplay.textContent = text.trim();
                    dDisplay.classList.add('calculated');
                } else if (activePreference === 'delivery') {
                    delDisplay.textContent = text.trim();
                    delDisplay.classList.add('calculated');
                }
                periodValid = true;
            } else {
                if (activePreference === 'dealership') {
                    dDisplay.textContent = 'Drop-off must be after pick-up';
                    dDisplay.classList.remove('calculated');
                } else if (activePreference === 'delivery') {
                    delDisplay.textContent = 'Drop-off must be after pick-up';
                    delDisplay.classList.remove('calculated');
                }
            }
        } else {
            if (dDisplay) {
                dDisplay.textContent = 'Select dates to calculate';
                dDisplay.classList.remove('calculated');
            }
            if (delDisplay) {
                delDisplay.textContent = 'Select dates to calculate';
                delDisplay.classList.remove('calculated');
            }
        }

        // Unlock and Auto-Expand Bill card if valid period is calculated
        if (periodValid) {
            billCard.classList.remove('locked');
            billCard.classList.add('open');
        } else {
            billCard.classList.add('locked');
            billCard.classList.remove('open');
        }

        // Compute Bill Totals
        const selectedCarKey = carSelect.value;
        const dailyRate = carRates[selectedCarKey] || 0;

        const billingDays = Math.max(1, Math.ceil(currentRentalDays)); 
        const rentAmount = dailyRate > 0 ? dailyRate * billingDays : 0;

        if (dailyRate > 0 && periodValid) {
            billRent.textContent = `$${rentAmount}`;
            billRent.classList.add('calculated');
        } else {
            billRent.textContent = `please select your car`;
            billRent.classList.remove('calculated');
        }

        if (periodValid) {
            billDeliveryFee.textContent = `$${deliveryFee}`;
            billDeliveryFee.classList.add('calculated');
        } else {
            billDeliveryFee.textContent = `$$`;
            billDeliveryFee.classList.remove('calculated');
        }

        if (dailyRate > 0 && periodValid) {
            const payableTotal = rentAmount + deliveryFee;
            billPayable.textContent = `$${payableTotal}`;
        } else {
            billPayable.textContent = `$$`;
        }
    }

    // 6. Bill Header Toggle
    const billHeaderToggle = document.getElementById('bill-header-toggle');
    billHeaderToggle.addEventListener('click', () => {
        if (!billCard.classList.contains('locked')) {
            billCard.classList.toggle('open');
        }
    });

    // 7. Mutual Exclusive Dropdown Buttons
    const btnDealership = document.getElementById('btn-dealership');
    const btnDelivery = document.getElementById('btn-delivery');
    const dealershipDetails = document.getElementById('dealership-details');
    const deliveryDetails = document.getElementById('delivery-details');

    if (!btnDealership || !btnDelivery) return;

    btnDealership.addEventListener('click', (e) => {
        e.preventDefault();
        const isOpen = dealershipDetails.classList.contains('open');

        deliveryDetails.classList.remove('open');
        btnDelivery.classList.remove('selected-green');

        if (isOpen) {
            dealershipDetails.classList.remove('open');
            btnDealership.classList.remove('selected-green');
            activePreference = 'none';
        } else {
            dealershipDetails.classList.add('open');
            btnDealership.classList.add('selected-green');
            activePreference = 'dealership';
        }
        calculateRentalAndBill();
    });

    btnDelivery.addEventListener('click', (e) => {
        e.preventDefault();
        const isOpen = deliveryDetails.classList.contains('open');

        dealershipDetails.classList.remove('open');
        btnDealership.classList.remove('selected-green');

        if (isOpen) {
            deliveryDetails.classList.remove('open');
            btnDelivery.classList.remove('selected-green');
            activePreference = 'none';
        } else {
            deliveryDetails.classList.add('open');
            btnDelivery.classList.add('selected-green');
            activePreference = 'delivery';
        }
        calculateRentalAndBill();
    });

    // 8. Confirmation Modal Handling
    const confirmBtn = document.getElementById('confirm-btn');
    const confirmationModal = document.getElementById('confirmation-modal');

    confirmBtn.addEventListener('click', () => {
        confirmationModal.classList.add('active');
    });

    calculateRentalAndBill();
});