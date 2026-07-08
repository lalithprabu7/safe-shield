import fs from 'fs';
import path from 'path';

// 3 Features:
// x0: Normalized Brightness
// x1: Contrast (Standard Deviation)
// x2: Edge Density / High-Frequency energy proxy

interface DataPoint {
  features: number[];
  label: number; // 1 = Genuine, 0 = Fake
}

function generateDataset(): DataPoint[] {
  const dataset: DataPoint[] = [];

  // Generate 200 Genuine Notes
  for (let i = 0; i < 200; i++) {
    dataset.push({
      features: [
        0.6 + Math.random() * 0.4, // Brightness
        0.5 + Math.random() * 0.5, // Contrast
        0.6 + Math.random() * 0.4  // Edge Density
      ],
      label: 1
    });
  }

  // Generate 200 Fake Notes
  for (let i = 0; i < 200; i++) {
    dataset.push({
      features: [
        Math.random() * 0.5,       // Lower Brightness
        Math.random() * 0.4,       // Lower Contrast
        Math.random() * 0.5        // Lower Edge Density
      ],
      label: 0
    });
  }

  return dataset;
}

function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

function sigmoidDerivative(z: number): number {
  const s = sigmoid(z);
  return s * (1 - s);
}

// Neural Network Architecture: 3 (Input) -> 4 (Hidden) -> 1 (Output)
function trainModel() {
  const dataset = generateDataset();
  
  // Initialize Weights and Biases randomly
  const inputSize = 3;
  const hiddenSize = 4;
  
  let w_ih = Array.from({ length: inputSize }, () => 
    Array.from({ length: hiddenSize }, () => Math.random() * 2 - 1)
  );
  let b_h = Array.from({ length: hiddenSize }, () => Math.random() * 2 - 1);
  
  let w_ho = Array.from({ length: hiddenSize }, () => Math.random() * 2 - 1);
  let b_o = Math.random() * 2 - 1;
  
  const learningRate = 0.1;
  const epochs = 2000;

  for (let epoch = 0; epoch < epochs; epoch++) {
    for (const data of dataset) {
      // --- FORWARD PASS ---
      // Hidden layer
      const hidden_z = new Array(hiddenSize).fill(0);
      const hidden_a = new Array(hiddenSize).fill(0);
      for (let j = 0; j < hiddenSize; j++) {
        for (let i = 0; i < inputSize; i++) {
          hidden_z[j] += data.features[i] * w_ih[i][j];
        }
        hidden_z[j] += b_h[j];
        hidden_a[j] = sigmoid(hidden_z[j]);
      }
      
      // Output layer
      let output_z = 0;
      for (let j = 0; j < hiddenSize; j++) {
        output_z += hidden_a[j] * w_ho[j];
      }
      output_z += b_o;
      const output_a = sigmoid(output_z);
      
      // --- BACKPROPAGATION ---
      const error = output_a - data.label; // Derivative of MSE loss (simplified) w.r.t a
      
      // Output layer gradients
      const delta_o = error * sigmoidDerivative(output_z);
      const grad_w_ho = hidden_a.map(a => a * delta_o);
      const grad_b_o = delta_o;
      
      // Hidden layer gradients
      const delta_h = new Array(hiddenSize).fill(0);
      const grad_w_ih = Array.from({ length: inputSize }, () => new Array(hiddenSize).fill(0));
      const grad_b_h = new Array(hiddenSize).fill(0);
      
      for (let j = 0; j < hiddenSize; j++) {
        delta_h[j] = delta_o * w_ho[j] * sigmoidDerivative(hidden_z[j]);
        grad_b_h[j] = delta_h[j];
        for (let i = 0; i < inputSize; i++) {
          grad_w_ih[i][j] = data.features[i] * delta_h[j];
        }
      }
      
      // --- UPDATE WEIGHTS ---
      for (let j = 0; j < hiddenSize; j++) {
        w_ho[j] -= learningRate * grad_w_ho[j];
        b_h[j] -= learningRate * grad_b_h[j];
        for (let i = 0; i < inputSize; i++) {
          w_ih[i][j] -= learningRate * grad_w_ih[i][j];
        }
      }
      b_o -= learningRate * grad_b_o;
    }
  }

  // Test Accuracy
  let correct = 0;
  for (const data of dataset) {
    const hidden_z = new Array(hiddenSize).fill(0);
    const hidden_a = new Array(hiddenSize).fill(0);
    for (let j = 0; j < hiddenSize; j++) {
      for (let i = 0; i < inputSize; i++) {
        hidden_z[j] += data.features[i] * w_ih[i][j];
      }
      hidden_z[j] += b_h[j];
      hidden_a[j] = sigmoid(hidden_z[j]);
    }
    
    let output_z = 0;
    for (let j = 0; j < hiddenSize; j++) {
      output_z += hidden_a[j] * w_ho[j];
    }
    output_z += b_o;
    const prediction = sigmoid(output_z) > 0.5 ? 1 : 0;

    if (prediction === data.label) {
      correct++;
    }
  }

  console.log(`MLP Training Complete. Accuracy: ${(correct / dataset.length) * 100}%`);
  
  const modelPath = path.join(__dirname, '../src/models/currency_weights.json');
  const modelState = {
    type: 'mlp',
    architecture: [3, 4, 1],
    w_ih, b_h, w_ho, b_o
  };
  fs.writeFileSync(modelPath, JSON.stringify(modelState, null, 2));
  console.log(`MLP Model weights saved to ${modelPath}`);
}

trainModel();
