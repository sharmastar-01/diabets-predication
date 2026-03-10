/**
 * DiaPredict Pro - Interactive JavaScript
 * Handles form submission, animations, and interactions
 */

// API Configuration
const API_URL = 'http://127.0.0.1:5000/predict';

// Store current prediction data for PDF export
let currentPredictionData = null;

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, initializing...');
    
    // Initialize form handling if on prediction page
    const predictionForm = document.getElementById('predictionForm');
    console.log('Form found:', !!predictionForm);
    
    if (predictionForm) {
        setupPredictionForm();
    }
    
    // Initialize other features
    initCounters();
    initNavbar();
});

// ============================================
// Prediction Form
// ============================================

function setupPredictionForm() {
    const form = document.getElementById('predictionForm');
    const predictBtn = document.getElementById('predictBtn');
    
    console.log('Setting up prediction form...');
    
    // Setup BMI auto-calculation
    const heightInput = document.getElementById('HEIGHT');
    const weightInput = document.getElementById('WEIGHT');
    const bmiInput = document.getElementById('BMI');
    
    if (heightInput && weightInput && bmiInput) {
        const calculateBMI = () => {
            const height = parseFloat(heightInput.value);
            const weight = parseFloat(weightInput.value);
            
            if (height > 0 && weight > 0) {
                const heightInMeters = height / 100;
                const bmi = weight / (heightInMeters * heightInMeters);
                bmiInput.value = bmi.toFixed(1);
            } else {
                bmiInput.value = '';
            }
        };
        
        heightInput.addEventListener('input', calculateBMI);
        weightInput.addEventListener('input', calculateBMI);
    }
    
    // Handle form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Form submitted!');
        
        // Get form values
        const data = getFormData();
        console.log('Form data:', data);
        
        // Validate
        if (!validateInputs(data)) {
            return;
        }
        
        // Show loading
        predictBtn.disabled = true;
        predictBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Analyzing...';
        
        try {
            // Make prediction
            const result = await makePrediction(data);
            console.log('Result:', result);
            
            // Show result
            showResult(result, data);
            
        } catch (error) {
            console.error('Error:', error);
            alert('Error: ' + error.message);
        } finally {
            predictBtn.disabled = false;
            predictBtn.innerHTML = '<span class="btn-content"><i class="fas fa-robot me-2"></i><span>Analyze Risk</span></span>';
        }
    });
}

function getFormData() {
    const features = [
        'AGE', 'GENDER', 'BUN', 'CREATININE', 'GLUCOSE', 'HBA1C', 'HDL', 'LDL', 
        'POTASSIUM', 'SODIUM', 'TOTAL_CHOLESTEROL', 'TRIGLYCERIDES', 'DIASTOLIC_BP', 
        'HEART_RATE', 'HEIGHT', 'SYSTOLIC_BP', 'WEIGHT', 'BMI'
    ];
    
    const data = {};
    features.forEach(feature => {
        const element = document.getElementById(feature);
        if (element) {
            data[feature] = parseFloat(element.value) || 0;
        }
    });
    
    return data;
}

function validateInputs(data) {
    const errors = [];
    
    if (data.AGE < 1 || data.AGE > 120) {
        errors.push('Age must be between 1 and 120 years');
    }
    
    if (data.GLUCOSE < 0 || data.GLUCOSE > 500) {
        errors.push('Glucose level must be between 0 and 500 mg/dL');
    }
    
    if (data.SYSTOLIC_BP < 60 || data.SYSTOLIC_BP > 250) {
        errors.push('Systolic blood pressure must be between 60 and 250 mmHg');
    }
    
    if (data.DIASTOLIC_BP < 40 || data.DIASTOLIC_BP > 150) {
        errors.push('Diastolic blood pressure must be between 40 and 150 mmHg');
    }
    
    if (data.BMI < 10 || data.BMI > 100) {
        errors.push('BMI must be between 10 and 100 kg/m²');
    }
    
    if (errors.length > 0) {
        alert('Please correct the following errors:\n' + errors.join('\n'));
        return false;
    }
    
    return true;
}

async function makePrediction(data) {
    try {
        // Try API first
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) throw new Error('API failed');
        
        return await response.json();
    } catch (error) {
        console.log('Using local prediction:', error);
        // Fallback to local calculation
        return localPrediction(data);
    }
}

function localPrediction(data) {
    let riskScore = 0;
    
    // Glucose (most important)
    if (data.GLUCOSE >= 126) riskScore += 30;
    else if (data.GLUCOSE >= 100) riskScore += 15;
    
    // HbA1c
    if (data.HBA1C >= 6.5) riskScore += 25;
    else if (data.HBA1C >= 5.7) riskScore += 10;
    
    // BMI
    if (data.BMI >= 30) riskScore += 15;
    else if (data.BMI >= 25) riskScore += 8;
    
    // Age
    if (data.AGE >= 45) riskScore += 10;
    else if (data.AGE >= 35) riskScore += 5;
    
    // Blood Pressure
    if (data.SYSTOLIC_BP >= 140 || data.DIASTOLIC_BP >= 90) riskScore += 10;
    
    // Cholesterol
    if (data.TOTAL_CHOLESTEROL >= 240) riskScore += 8;
    if (data.LDL >= 160) riskScore += 8;
    if (data.HDL < 40) riskScore += 8;
    
    // Triglycerides
    if (data.TRIGLYCERIDES >= 200) riskScore += 8;
    
    const probability = Math.min(riskScore / 100, 1);
    
    return {
        prediction: probability >= 0.5 ? 1 : 0,
        probability: probability
    };
}

function showResult(result, data) {
    const modal = document.getElementById('resultModal');
    if (!modal) {
        alert('Result: ' + (result.prediction === 1 ? 'High Risk - Diabetic' : 'Low Risk - Not Diabetic'));
        return;
    }
    
    const probability = result.probability;
    const percentage = Math.round(probability * 100);
    const isDiabetic = result.prediction === 1;
    
    // Set content
    const icon = document.getElementById('modalResultIcon');
    const title = document.getElementById('modalResultTitle');
    const message = document.getElementById('modalResultMessage');
    const probValue = document.getElementById('modalProbability');
    const probBar = document.getElementById('probabilityBar');
    const header = document.querySelector('.result-header');
    
    if (isDiabetic) {
        icon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
        icon.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
        header.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
        title.textContent = '⚠️ High Risk - Diabetic';
        title.style.color = '#ef4444';
        probBar.style.background = 'linear-gradient(90deg, #f59e0b, #ef4444)';
    } else {
        icon.innerHTML = '<i class="fas fa-check-circle"></i>';
        icon.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        header.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        title.textContent = '✅ Low Risk - Not Diabetic';
        title.style.color = '#10b981';
        probBar.style.background = 'linear-gradient(90deg, #10b981, #06b6d4)';
    }
    
    message.textContent = `Based on the analysis, there is a ${percentage}% probability of diabetes.`;
    probValue.textContent = percentage + '%';
    probBar.style.width = percentage + '%';
    
    // Store data for PDF
    currentPredictionData = { data, result: { isDiabetic, probability, percentage } };
    
    // Setup button handlers
    const newPredictionBtn = document.getElementById('newPredictionModal');
    const downloadPdfBtn = document.getElementById('downloadPdfModal');
    
    if (newPredictionBtn) {
        newPredictionBtn.onclick = function() {
            const modalInstance = bootstrap.Modal.getInstance(modal);
            if (modalInstance) modalInstance.hide();
            document.getElementById('predictionForm').reset();
            document.getElementById('BMI').value = '';
        };
    }
    
    if (downloadPdfBtn) {
        downloadPdfBtn.onclick = function() {
            generatePdfReport();
        };
    }
    
    // Show modal using Bootstrap
    const modalInstance = new bootstrap.Modal(modal);
    modalInstance.show();
}

function generatePdfReport() {
    if (!currentPredictionData) {
        alert('Please make a prediction first');
        return;
    }
    
    const { data, result } = currentPredictionData;
    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString();
    
    const reportContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Diabetes Prediction Report</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; background: #0f172a; color: #fff; }
                .header { text-align: center; border-bottom: 3px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
                .header h1 { color: #6366f1; margin: 0; }
                .header p { color: #94a3b8; margin: 5px 0; }
                .result { text-align: center; padding: 30px; border-radius: 10px; margin: 20px 0; }
                .result.positive { background: #fee2e2; border: 2px solid #ef4444; }
                .result.negative { background: #d1fae5; border: 2px solid #10b981; }
                .result h2 { margin: 0; font-size: 28px; color: #333; }
                .result p { font-size: 18px; margin: 10px 0 0; color: #333; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { padding: 12px; text-align: left; border-bottom: 1px solid #334155; color: #fff; }
                th { background: #1e293b; color: #6366f1; }
                .disclaimer { background: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 20px; color: #333; font-size: 12px; }
                @media print { body { background: white; color: black; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🏥 DiaPredict Pro - Diabetes Prediction Report</h1>
                <p>Generated on ${date} at ${time}</p>
            </div>
            
            <div class="result ${result.isDiabetic ? 'positive' : 'negative'}">
                <h2>${result.isDiabetic ? '⚠️ High Risk - Diabetic' : '✅ Low Risk - Not Diabetic'}</h2>
                <p>Probability: ${result.percentage}%</p>
            </div>
            
            <h3>📊 Your Health Metrics</h3>
            <table>
                <tr><th>Parameter</th><th>Your Value</th><th>Reference Range</th></tr>
                <tr><td>Age</td><td>${data.AGE} years</td><td>21-45 years</td></tr>
                <tr><td>Glucose</td><td>${data.GLUCOSE} mg/dL</td><td>70-99 mg/dL</td></tr>
                <tr><td>HbA1c</td><td>${data.HBA1C}%</td><td>&lt;5.7%</td></tr>
                <tr><td>BMI</td><td>${data.BMI} kg/m²</td><td>18.5-24.9 kg/m²</td></tr>
                <tr><td>Blood Pressure</td><td>${data.SYSTOLIC_BP}/${data.DIASTOLIC_BP} mmHg</td><td>&lt;120/80 mmHg</td></tr>
            </table>
            
            <div class="disclaimer">
                <strong>⚠️ Disclaimer:</strong> This prediction is for educational purposes only. Not medical advice. Consult a healthcare provider.
            </div>
        </body>
        </html>
    `;
    
    // Open in new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(reportContent);
    printWindow.document.close();
    printWindow.print();
}

// ============================================
// Counter Animation
// ============================================

function initCounters() {
    const counters = document.querySelectorAll('.counter');
    if (counters.length === 0) return;
    
    // Fetch real-time stats
    fetchStats();
    
    // Animate counters when visible
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseFloat(counter.getAttribute('data-target'));
                animateCounter(counter, target);
                observer.unobserve(counter);
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(c => observer.observe(c));
}

function fetchStats() {
    fetch('/api/stats')
        .then(res => res.json())
        .then(stats => {
            console.log('Stats:', stats);
        })
        .catch(err => console.log('Stats error:', err));
}

function animateCounter(element, target) {
    const isDecimal = target % 1 !== 0;
    const duration = 2000;
    const start = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        const current = target * easeOut;
        
        if (isDecimal) {
            element.textContent = current.toFixed(1);
        } else {
            element.textContent = Math.floor(current);
        }
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// ============================================
// Navbar
// ============================================

function initNavbar() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// Add navbar scroll styles
const navStyles = document.createElement('style');
navStyles.textContent = `
    .navbar.scrolled {
        background: rgba(15, 23, 42, 0.95) !important;
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
    }
`;
document.head.appendChild(navStyles);

console.log('JavaScript loaded successfully!');
