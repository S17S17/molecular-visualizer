document.addEventListener('DOMContentLoaded', function() {
    // Three.js setup
    const canvas = document.getElementById('molecule-canvas');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setClearColor(0xf8f9fa);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Element colors and sizes
    const elementColors = {
        'H': 0xFFFFFF,
        'O': 0xFF0000,
        'C': 0x333333,
        'N': 0x0000FF,
        'Cl': 0x00FF00,
        'F': 0x00FFFF,
        'Na': 0x0000FF,
        'Mg': 0x00FF00,
        'P': 0xFF8000,
        'S': 0xFFFF00,
        'default': 0xFFFF00
    };
    
    const elementSizes = {
        'H': 0.4,
        'O': 0.8,
        'C': 0.7,
        'N': 0.7,
        'Cl': 0.9,
        'F': 0.6,
        'Na': 0.9,
        'Mg': 0.9,
        'P': 0.8,
        'S': 0.8,
        'default': 0.6
    };
    
    // Group to hold all molecule objects
    const moleculeGroup = new THREE.Group();
    scene.add(moleculeGroup);
    
    // Create atoms
    const atoms = moleculeData.atoms;
    const atomObjects = [];
    
    atoms.forEach(atom => {
        const element = atom.element;
        const position = atom.position;
        
        const color = elementColors[element] || elementColors['default'];
        const size = elementSizes[element] || elementSizes['default'];
        
        const geometry = new THREE.SphereGeometry(size, 32, 32);
        const material = new THREE.MeshPhongMaterial({ color: color });
        const sphere = new THREE.Mesh(geometry, material);
        
        sphere.position.set(...position);
        sphere.userData = { element: element, originalPosition: [...position] };
        
        moleculeGroup.add(sphere);
        atomObjects.push(sphere);
    });
    
    // Create bonds between atoms
    const bondObjects = [];
    
    // Helper function to calculate distance between atoms
    function distance(atom1, atom2) {
        return Math.sqrt(
            Math.pow(atom1.position[0] - atom2.position[0], 2) +
            Math.pow(atom1.position[1] - atom2.position[1], 2) +
            Math.pow(atom1.position[2] - atom2.position[2], 2)
        );
    }
    
    // Helper function to create cylinder between two points
    function createCylinderBetweenPoints(pointX, pointY, radius, material) {
        const direction = new THREE.Vector3().subVectors(pointY, pointX);
        
        const edgeGeometry = new THREE.CylinderGeometry(radius, radius, direction.length(), 8, 1);
        const edge = new THREE.Mesh(edgeGeometry, material);
        
        edge.position.copy(pointX);
        edge.position.addScaledVector(direction, 0.5);
        edge.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            direction.clone().normalize()
        );
        
        return edge;
    }
    
    // Create bonds based on distance
    const bondMaterial = new THREE.MeshPhongMaterial({ color: 0xCCCCCC });
    
    for (let i = 0; i < atoms.length; i++) {
        for (let j = i + 1; j < atoms.length; j++) {
            const atom1 = atoms[i];
            const atom2 = atoms[j];
            
            // Calculate bond distance threshold based on elements
            const element1 = atom1.element;
            const element2 = atom2.element;
            
            let bondThreshold = 2.0; // Default threshold
            
            // Adjust threshold based on element pairs
            if (element1 === 'H' || element2 === 'H') {
                bondThreshold = 1.2;
            } else if ((element1 === 'C' && element2 === 'O') || 
                       (element1 === 'O' && element2 === 'C')) {
                bondThreshold = 1.5;
            } else if ((element1 === 'C' && element2 === 'N') || 
                       (element1 === 'N' && element2 === 'C')) {
                bondThreshold = 1.5;
            } else if ((element1 === 'C' && element2 === 'C')) {
                bondThreshold = 1.7;
            }
            
            const dist = distance(atom1, atom2);
            
            if (dist < bondThreshold) {
                const point1 = new THREE.Vector3(...atom1.position);
                const point2 = new THREE.Vector3(...atom2.position);
                
                const bond = createCylinderBetweenPoints(point1, point2, 0.2, bondMaterial);
                bond.userData = { 
                    atom1: i, 
                    atom2: j,
                    originalStart: [...atom1.position],
                    originalEnd: [...atom2.position]
                };
                
                moleculeGroup.add(bond);
                bondObjects.push(bond);
            }
        }
    }
    
    // Center the molecule
    const box = new THREE.Box3().setFromObject(moleculeGroup);
    const center = box.getCenter(new THREE.Vector3());
    moleculeGroup.position.sub(center);
    
    // Position camera
    camera.position.z = 5;
    
    // Animation state
    let currentStep = 0;
    const totalSteps = animationSequence.length;
    let animationTime = 0;
    const stepDuration = 5; // seconds per step
    
    // Animation controls
    const prevButton = document.getElementById('prev-step');
    const nextButton = document.getElementById('next-step');
    const progressBar = document.getElementById('animation-progress');
    const currentStepText = document.getElementById('current-step-text');
    const animationStepsList = document.getElementById('animation-steps').getElementsByTagName('li');
    
    prevButton.addEventListener('click', function() {
        if (currentStep > 0) {
            currentStep--;
            updateAnimationStep();
        }
    });
    
    nextButton.addEventListener('click', function() {
        if (currentStep < totalSteps - 1) {
            currentStep++;
            updateAnimationStep();
        }
    });
    
    function updateAnimationStep() {
        // Update UI
        for (let i = 0; i < animationStepsList.length; i++) {
            if (i === currentStep) {
                animationStepsList[i].classList.add('fw-bold');
            } else {
                animationStepsList[i].classList.remove('fw-bold');
            }
        }
        
        currentStepText.textContent = `Step ${currentStep + 1}/${totalSteps}`;
        progressBar.style.width = `${((currentStep + 1) / totalSteps) * 100}%`;
        
        // Reset animation time
        animationTime = 0;
    }
    
    // Animation functions
    function rotateY(t) {
        moleculeGroup.rotation.y = t * Math.PI * 2;
    }
    
    function rotateX(t) {
        moleculeGroup.rotation.x = t * Math.PI * 2;
    }
    
    function zoom(t, zoomIn = true) {
        const scale = zoomIn ? 1 + t : 2 - t;
        moleculeGroup.scale.set(scale, scale, scale);
    }
    
    function vibrate(t) {
        const vibrationAmount = 0.1;
        const frequency = 10;
        
        atomObjects.forEach((atom, index) => {
            const originalPos = atom.userData.originalPosition;
            const offset = Math.sin(t * frequency * Math.PI * 2) * vibrationAmount;
            
            atom.position.x = originalPos[0] + offset * (Math.sin(index * 100));
            atom.position.y = originalPos[1] + offset * (Math.cos(index * 100));
            atom.position.z = originalPos[2] + offset * (Math.sin(index * 50 + 0.5));
        });
        
        // Update bonds
        bondObjects.forEach(bond => {
            const atom1 = atomObjects[bond.userData.atom1];
            const atom2 = atomObjects[bond.userData.atom2];
            
            const point1 = atom1.position.clone();
            const point2 = atom2.position.clone();
            
            // Remove the old bond
            moleculeGroup.remove(bond);
            
            // Create a new bond
            const newBond = createCylinderBetweenPoints(point1, point2, 0.2, bondMaterial);
            newBond.userData = bond.userData;
            
            moleculeGroup.add(newBond);
            
            // Replace the old bond in the array
            const index = bondObjects.indexOf(bond);
            if (index !== -1) {
                bondObjects[index] = newBond;
            }
        });
    }
    
    function resetVibration() {
        atomObjects.forEach(atom => {
            const originalPos = atom.userData.originalPosition;
            atom.position.set(...originalPos);
        });
    }
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        const deltaTime = 1/60; // Assume 60fps
        animationTime += deltaTime;
        
        // Normalize time within step (0 to 1)
        const t = (animationTime % stepDuration) / stepDuration;
        
        // Apply animation based on current step
        const stepText = animationSequence[currentStep].toLowerCase();
        
        if (stepText.includes('rotate') && stepText.includes('y')) {
            rotateY(t);
        } else if (stepText.includes('rotate') && stepText.includes('x')) {
            rotateX(t);
        } else if (stepText.includes('zoom') && stepText.includes('in')) {
            zoom(t, true);
        } else if (stepText.includes('zoom') && stepText.includes('out')) {
            zoom(t, false);
        } else if (stepText.includes('vibrate') || stepText.includes('oscillate')) {
            vibrate(t);
        } else {
            // Default animation: gentle rotation
            rotateY(t * 0.25);
        }
        
        // Auto-advance to next step
        if (animationTime >= stepDuration) {
            animationTime = 0;
            if (currentStep < totalSteps - 1) {
                currentStep++;
                updateAnimationStep();
            } else {
                // Loop back to first step
                currentStep = 0;
                updateAnimationStep();
            }
        }
        
        renderer.render(scene, camera);
    }
    
    // Start animation
    updateAnimationStep();
    animate();
});