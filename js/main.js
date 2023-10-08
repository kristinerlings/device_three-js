import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'; //https://discourse.threejs.org/t/gltfloader-cannot-be-found/42254/4
import portalVertexShader from './shaders/portal/vertex.glsl?raw'; //tell vite it's a string ?raw
import portalFragmentShader from './shaders/portal/fragment.glsl?raw';


const $canvas = document.querySelector('.webglCanvas');
const scene = new THREE.Scene();
const textureLoader = new THREE.TextureLoader();
scene.background = textureLoader.load('assets/7861.jpg');

const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

// ========   FLOOR   ======== //
/* const geometry = new THREE.CylinderGeometry(2, 2, 2, 32);
const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const cylinder = new THREE.Mesh(geometry, material); */
/* scene.add(cylinder); */
const floorGeometry = new THREE.CylinderGeometry(2, 2, 1, 32);
const floorTexture = textureLoader.load('assets/augustine-wong-li0iC0rjvvg-unsplash.jpg'
);
const floorMaterial = new THREE.MeshStandardMaterial({
  color: '#ffffff',
  map: floorTexture,
});
const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
floorMesh.receiveShadow = true;
/* floorMesh.rotation.x = Math.PI * -0.5; */
floorMesh.position.y = -2.5;
scene.add(floorMesh);



// ========   RAYCASTER   ======== //
const raycaster = new THREE.Raycaster();
const mousePointer = new THREE.Vector2();

const size = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const camera = new THREE.PerspectiveCamera(
  50,
  size.width / size.height,
  0.1,
  100
);
camera.position.x = 8;
camera.position.y = 3;
camera.position.z = 3;
scene.add(camera);

const orbitControls = new OrbitControls(camera, $canvas);
orbitControls.enableDamping = true;

const renderer = new THREE.WebGLRenderer({
  canvas: $canvas,
  antialias: true,
});
renderer.shadowMap.enabled = true;

//set size of renderer to size object at top.
renderer.setSize(size.width, size.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// ========   LIGHT   ======== //
const light = new THREE.DirectionalLight('#ffffff', 3);
light.position.set(8, 10, 8.5);
light.castShadow = true;
scene.add(light)


// ======== AUDIO ======= //
const listener = new THREE.AudioListener();
camera.add(listener);
const sound = new THREE.PositionalAudio(listener);

// load a sound and set it as the Audio object's buffer
const audioLoader = new THREE.AudioLoader();
audioLoader.load('assets/8bit-sample-69080.mp3', function (buffer) {
  sound.setBuffer(buffer);
  sound.setLoop(true);
  sound.setRefDistance(20);
});
console.log('audioLoader', audioLoader);

let isAudioPlaying = false;

// ========   PORTAL/Screen-device   ======== //
const deviceDisplayPlaneMaterial = new THREE.ShaderMaterial({
  uniforms: {
    iTime: { value: 0.0 },
    iResolution: { value: new THREE.Vector2(size.width, size.height) },
    u_backgroundColor: { value: new THREE.Vector4(0.0, 0.3, 0.65, 0.6) }, // default color
    u_shapeMapIncrementNr: { value: 8 },
    u_color1: { value: new THREE.Vector3(0.4235, 0.5843, 0.4588) },
    u_color2: { value: new THREE.Vector3(0.8667, 0.7686, 0.4392) },
  },
  vertexShader: portalVertexShader,
  fragmentShader: portalFragmentShader,
});

// ========   LOADER   ======== //
const loader = new GLTFLoader();
let clickableBlenderObjects = [];

loader.load(
  'assets/gameDeviceThree.glb',
  (gltf) => {
    console.log('gltf:', gltf);

    gltf.scene.traverse((child) => {
      console.log('traverse, blender child name:', child.name);

      if (child.name === 'screenShader001') {
        child.material = deviceDisplayPlaneMaterial;
      }

      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        const clickableButtons = [
          'btn1001',
          'btn2001',
          'btn3001',
          'btn4001',
          'btnCross001',
          'btnOFF001',
        ];

        if (clickableButtons.includes(child.name)) {
          console.log(child.name);
          clickableBlenderObjects.push(child);
        }
      }
    });
    scene.add(gltf.scene);
    gltf.scene.position.y = -1.5;
    gltf.add(sound);
  
  },
  // called while loading is progressing
  (xhr) => {
    console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
  },
  (error) => {
    console.log('An error happened');
  }
);



// ========   Animate shader   ======== //
const clock = new THREE.Clock();


const initDraw = () => {
  const timePassed = clock.getElapsedTime();
  deviceDisplayPlaneMaterial.uniforms.iTime.value = timePassed; //update iTime in shader

  hoverButton();

  renderer.render(scene, camera);
  window.requestAnimationFrame(initDraw); // make it loop
};

function createCloud() {
  // Create an empty container that will hold the cloud parts
  const cloud = new THREE.Object3D();

  // Sphere geometry for the cloud parts
  const geom = new THREE.SphereGeometry(0.7, 32, 32);
  const mat = new THREE.MeshPhongMaterial({ color: '#ffffff' });

  // Using a loop to add exactly 5 spheres
  for (let i = 0; i < 5; i++) {
    const sphere = new THREE.Mesh(geom, mat);

    // Position spheres with a little bit of randomness for natural look
    sphere.position.set(
      Math.random() * 0.5 - 0.5,
      Math.random() * 1 - 0.5,
      Math.random() * 2 - 0.5
    );

    // Allow sphere to cast and receive shadows
    sphere.castShadow = true;
    sphere.receiveShadow = true;

    // Add sphere to the cloud container
    cloud.add(sphere);
  }

  // Return the cloud so it can be added to the scene externally
  return cloud;
}

const clouds = []; // An array to store all the cloud containers

function spawnClouds(scene, numClouds) {
  for (let i = 0; i < numClouds; i++) {
    const cloud = createCloud();

    // Initially position clouds off to the right so they can move left into view
    cloud.position.set(
      Math.random() * 3 - 1, // Range from -5 to 5
      Math.random() * 7 - 8, // Range from -5 to 5
      Math.random() * 5 - 3 // Range from -5 to 5
    );


    clouds.push(cloud);
    scene.add(cloud);
  }
}

function animateClouds() {
    clouds.forEach((cloud) => {
        cloud.rotation.y += 0.01;
    });


}

// This is the main animation loop
function tanimate() {
  requestAnimationFrame(tanimate);
  animateClouds();
 
}

// Assuming `scene` has already been defined elsewhere in your code.
spawnClouds(scene, 25); // for example, add 10 clouds

// Start the animation
tanimate();


const colors = {
  green: '#6C9575',
  yellow: '#DDC470',
  blue: '#0000ff',
  orange: '#ffa500',
  aqua: '#00ffff',
  red: '#ff0000',
  poisonGreen: '#00ff00',
  cyan: '#00ff00',
  lightBlue: '#004DA6',
};

// ======== CHANGE COLORS ======= //
const colorOptions = [
  {
    backgroundColor: new THREE.Vector4(0.0, 0.3, 0.65, 0.6), //blue
    color1: new THREE.Color(colors.green),
    color2: new THREE.Color(colors.yellow),
  },
  {
    backgroundColor: new THREE.Vector4(1.0, 0.8, 0.81, 0.9), //pink
    color1: new THREE.Color(colors.blue),
    color2: new THREE.Color(colors.orange),
  },
  {
    backgroundColor: new THREE.Vector4(0.1, 0.4, 0.25, 0.6), //green
    color1: new THREE.Color(colors.aqua),
    color2: new THREE.Color(colors.red),
  },
  {
    backgroundColor: new THREE.Vector4(0.2, 0.2, 0.75, 0.9), //purple
    color1: new THREE.Color(colors.poisonGreen),
    color2: new THREE.Color(colors.blue),
  },
];

// update color in shader
const updateColorInShader = (colorOptions) => {
  deviceDisplayPlaneMaterial.uniforms.u_backgroundColor.value =
    colorOptions.backgroundColor;
  deviceDisplayPlaneMaterial.uniforms.u_color1.value = new THREE.Vector3(
    colorOptions.color1.r,
    colorOptions.color1.g,
    colorOptions.color1.b
  );
  deviceDisplayPlaneMaterial.uniforms.u_color2.value = new THREE.Vector3(
    colorOptions.color2.r,
    colorOptions.color2.g,
    colorOptions.color2.b
  );
};

const updateShapeInShader = (shapeOptions) => {
  deviceDisplayPlaneMaterial.uniforms.u_shapeMapIncrementNr.value =
    shapeOptions.incrementNr;
};

// ========   Change color   ======== //
const $btnShapes = document.querySelectorAll('.btn__shape');
$btnShapes.forEach((btn) => {
  btn.addEventListener('click', () => {
    const shape = btn.dataset.shape;
    updateShapeInShader(shapeOptions[shape]);
    console.log(shape);
  });
});

// ========   Mouse click   ======== //
let currentHoveredObject = null;
let lastHoveredObject = null;
const applyHoverMaterial = (object) => {
  if (!object.originalMaterial) {
    object.originalMaterial = object.material.clone(); // Store the original material
  }

  object.material = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    emissive: '#000000',
    opacity: 0.8,
    transparent: true,
  });
}

const resetMaterial = (object) => {
  if (object.originalMaterial) {
    object.material = object.originalMaterial;
    object.originalMaterial = null;
  }
}

const hoverButton = () => {
  raycaster.setFromCamera(mousePointer, camera);
  const intersects = raycaster.intersectObjects(clickableBlenderObjects);

  if (intersects.length > 0) {
    const object = intersects[0].object;

    // Only hover the closest object
    if (lastHoveredObject && lastHoveredObject !== object) {
      resetMaterial(lastHoveredObject); //reset material
    }
    applyHoverMaterial(object);
    lastHoveredObject = object; // Update 
  } else {
    if (lastHoveredObject) {
      // no hover, reset the last hovered object
      resetMaterial(lastHoveredObject);
      lastHoveredObject = null;
    }
  }
};

const clickButton = (event) => {
  raycaster.setFromCamera(mousePointer, camera);
  const intersects = raycaster.intersectObjects(clickableBlenderObjects); //get all the objects that intersects with the raycaster

  if (intersects.length > 0) {
    const object = intersects[0].object;
    const point = intersects[0].point; // Intersection point in world coordinates + button
    object.worldToLocal(point); //translate the point to local space of the button

    const setTime = 300;

    const handleButtonClick = (colorIndex, positionValue) => {
      updateColorInShader(colorOptions[colorIndex - 1]);
      object.position.x -= positionValue;
      setTimeout(() => {
        object.position.x += positionValue;
      }, setTime);
    };

    switch (object.name) {
      case 'btnOFF001':
        if (!isAudioPlaying) {
          sound.play();
          isAudioPlaying = true;
        } else {
          sound.pause();
          isAudioPlaying = false;
        }
        object.position.x -= 0.03;
        setTimeout(() => {
          object.position.x += 0.03;
        }, setTime);
        break;
      case 'btn1001':
        handleButtonClick(1, 0.06);
        break;
      case 'btn2001':
        handleButtonClick(2, 0.06);
        break;
      case 'btn3001':
        handleButtonClick(3, 0.06);
        break;
      case 'btn4001':
        handleButtonClick(4, 0.06);
        break;
      case 'btnCross001':
        console.log('Clicked on button cross');

        const left = point.z > 0 && Math.abs(point.x) < Math.abs(point.z);
        const right = point.z < 0 && Math.abs(point.x) < Math.abs(point.z);
        const top = point.x < 0 && Math.abs(point.y) < Math.abs(point.x);
        const bottom = point.x > 0 && Math.abs(point.y) < Math.abs(point.x);

        const handleCrossButton = (
          rotationAxis,
          rotationValue,
          shaderIncrementValue
        ) => {
          object.rotation[rotationAxis] += rotationValue; //rotate left
          setTimeout(() => {
            object.rotation[rotationAxis] -= rotationValue;
          }, setTime);
          updateShapeInShader({ incrementNr: shaderIncrementValue });
        };

        if (object.name === 'btnCross001') {
          if (left) {
            handleCrossButton('y', -0.1, 5);
          } else if (right) {
            handleCrossButton('y', 0.1, 55);
          } else if (bottom) {
            handleCrossButton('z', -0.1, 8);
          } else if (top) {
            handleCrossButton('z', 0.1, 20);
          }
        }
        break;
      default:
        break;
    }
  }
};

$canvas.addEventListener('click', clickButton);

// ========   Raycasting   ======== //
const onPointerMove = (event) => {
  // calculate pointer position in normalized device coordinates
  mousePointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  mousePointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
};

window.addEventListener('pointermove', onPointerMove);

//on resize -> update size, camera and renderer
window.addEventListener('resize', () => {
  //Update size
  size.width = window.innerWidth;
  size.height = window.innerHeight;

  //update camera
  camera.aspect = size.width / size.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(size.width, size.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  //update iResolution in my shader
  deviceDisplayPlaneMaterial.uniforms.iResolution.value.set(
    size.width,
    size.height
  );
});

initDraw();
