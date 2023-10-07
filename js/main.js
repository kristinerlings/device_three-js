import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
//import { GLTFLoader } from 'three/addons/GLTFLoader.js'; // I get network error if I use this one
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'; //use this until I ask the teacher : https://discourse.threejs.org/t/gltfloader-cannot-be-found/42254/4

import portalVertexShader from './shaders/portal/vertex.glsl?raw'; //vite doesn't know about gls. Will get an error so: Will add ? and specify raw (tell it's just a string)
import portalFragmentShader from './shaders/portal/fragment.glsl?raw';

const $canvas = document.querySelector('.webglCanvas');
const scene = new THREE.Scene();
scene.add(new THREE.AxesHelper(2)); //remember to comment out
const textureLoader = new THREE.TextureLoader();
scene.background = textureLoader.load('assets/7861.jpg');

//scene.background = new THREE.Color('#89A4BF'); //('#d9b99b')

const ambientLight = new THREE.AmbientLight(0xffffff, 2);
// scene.add(ambientLight);

// ========   FLOOR   ======== //
const floorGeometry = new THREE.PlaneGeometry(10, 10); //new THREE.PlaneGeometry(5, 10); //create a plane - use buffer?
const floorMaterial = new THREE.MeshStandardMaterial({
  // color: '#43515e', //'#242B32',
  color: '#ffffff',
  //wireframe: true,
}); //create a material
/* const floorTexture = new THREE.TextureLoader().load('assets/floor.jpg'); //load texture */
//floorMaterial.map = floorTexture; //assign texture to material
const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial); //create a mesh
floorMesh.receiveShadow = true; //receive shadows
floorMesh.rotation.x = Math.PI * -0.5; //rotate the floor 90 degrees
floorMesh.position.y = -2.5; //move the floor down
//round corners

scene.add(floorMesh); //add the floor to the scene

// ========   RAYCASTER   ======== //
//https://threejs.org/docs/#api/en/core/Raycaster
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
  //alpha: true,
  antialias: true,
});
renderer.shadowMap.enabled = true;

//set size of renderer to size object at top.
renderer.setSize(size.width, size.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// ========   LIGHT   ======== //
const light = new THREE.DirectionalLight('#ffffff', 3); //new THREE.SpotLight('#2e3033', 1000);
light.position.set(8, 10, 8.5);
light.castShadow = true;
/* light.shadow.mapSize.width = 1024;
light.shadow.mapSize.height = 1024; */
// light.shadow.camera.near = 1;
// light.shadow.camera.far = 50;
const lightHelper = new THREE.DirectionalLightHelper(light, 3);
scene.add(light, lightHelper); //take out helper before submitting
const lightShadowHelper = new THREE.CameraHelper(light.shadow.camera);
scene.add(lightShadowHelper);

// ======== AUDIO ======= // 1. audio listener -> camera. 2. audio position -> 3dmodel/device
// create an AudioListener and add it to the camera
const listener = new THREE.AudioListener();
camera.add(listener);

// create a global audio source
//const sound = new THREE.Audio(listener);
// create the PositionalAudio object (passing in the listener)
const sound = new THREE.PositionalAudio(listener);

// load a sound and set it as the Audio object's buffer
const audioLoader = new THREE.AudioLoader();
audioLoader.load('assets/8bit-sample-69080.mp3', function (buffer) {
  sound.setBuffer(buffer);
  sound.setLoop(true);
  //sound.setVolume(0.5); //maybe change later depending on camera distance?
  sound.setRefDistance(20);
});
console.log('audioLoader', audioLoader);

let isAudioPlaying = false;

// ========   BAKED   ======== //
const colorDevice = {
  red: '#D13F2E',
  dark: '#140006',
};
//const textureBlender = new THREE.TextureLoader().load('assets/baked3.jpg');
//textureBlender.flipY = false; //y axis of textures I load is inverted. This is boolean... not -1
//THe meshBasicMaterial doesn't receive shadows/light??? MeshStandardMaterial -> does not work ?
/* const material = new THREE.MeshBasicMaterial({
  color: colorDevice.red,
}); */
const material = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  emissive: colorDevice.red,
});

//uniforms: pass data from js to shader (vertex and fragment)
// ========   PORTAL/Screen-device   ======== //
const deviceDisplayPlaneMaterial = new THREE.ShaderMaterial({
  uniforms: {
    iTime: { value: 0.0 },
    iResolution: { value: new THREE.Vector2(size.width, size.height) },
    //iMouse: { value: new THREE.Vector2() },
    touchEffect: { value: 0.0 },
    u_backgroundColor: { value: new THREE.Vector4(0.0, 0.3, 0.65, 0.6) }, // default color
    u_shapeMapIncrementNr: { value: 8 },
    u_color1: { value: new THREE.Vector3(0.4235, 0.5843, 0.4588) },
    u_color2: { value: new THREE.Vector3(0.8667, 0.7686, 0.4392) },
  },
  vertexShader: portalVertexShader,
  fragmentShader: portalFragmentShader,
});

// ========   LOADER   ======== //
const loader = new GLTFLoader(); //to be able to load gltf files - blender
let clickableBlenderObjects = [];

// Load a glTF resource
loader.load(
  // resource URL
  'assets/gameDeviceThree.glb',
  // called when the resource is loaded
  (gltf) => {
    console.log('gltf:', gltf);
    //loop through each of the children (assign the model to all of the children):
    gltf.scene.traverse((child) => {
      if (child.name === 'device001') {
        // child.material = new THREE.MeshStandardMaterial({
        //   color: colorDevice.red,
        // });
        // child.castShadow = true;
        // child.receiveShadow = true;
      }
      console.log('traverse, blender child name:', child.name);
      if (child.name === 'screenShader001') {
        //display shaderToy on device screen
        child.material = deviceDisplayPlaneMaterial;
      } else {
        // child.material = material; //child of material, is same as material
      }

      console.log('isMesh:', child);
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true; 
        switch (child.name) {
          case 'device001':
            /*      child.material = material;
            child.receiveShadow = true; */
            break;
          case 'btn1001':
            console.log('btn1001');
            clickableBlenderObjects.push(child);
            //child.material.color.set(colorDevice.red);
            /* child.material = new THREE.MeshStandardMaterial({
              color: colorDevice.dark,
            }); */
            /* child.material.castShadow = true;
            child.material.receiveShadow = true; */
            break;
          case 'btn2001':
            console.log('btn2');
            clickableBlenderObjects.push(child);
            child.material.color.set(colorDevice.dark);

          /*   child.material = new THREE.MeshStandardMaterial({
              color: colorDevice.dark,
            }); */
            break;
          case 'btn3001':
            console.log('btn301');
            clickableBlenderObjects.push(child);
             child.material.color.set(colorDevice.dark);
            /*  child.material = new THREE.MeshStandardMaterial({
              color: colorDevice.dark,
            }); */
            break;
          case 'btn4001':
            console.log('btn401');
            clickableBlenderObjects.push(child);
             child.material.color.set(colorDevice.dark);
            /* child.material = new THREE.MeshStandardMaterial({
              color: colorDevice.dark,
            }); */
            break;
          case 'btnCross001':
            console.log('btnCross001');
            clickableBlenderObjects.push(child);
             child.material.color.set(colorDevice.dark);
            /*  child.material = new THREE.MeshStandardMaterial({
              color: colorDevice.dark,
            }); */
            break;
          case 'device-dark001':
             child.material.color.set(colorDevice.dark);
            /*  child.material = new THREE.MeshStandardMaterial({
              color: colorDevice.dark,
            }); */
            break;
          case 'btnOFF001':
            clickableBlenderObjects.push(child);
             child.material.color.set(colorDevice.dark);
            /*  child.material = new THREE.MeshStandardMaterial({
              color: colorDevice.dark,
            }); */
            break;
          case 'btnSmall1001':
            clickableBlenderObjects.push(child);
             child.material.color.set(colorDevice.dark);
            /*  child.material = new THREE.MeshStandardMaterial({
              color: colorDevice.dark,
            }); */
            break;
          case 'btnSmall2001':
            clickableBlenderObjects.push(child);
             child.material.color.set(colorDevice.dark);
            /*  child.material = new THREE.MeshStandardMaterial({
              color: colorDevice.dark,
            }); */
            break;
        }
      }
    });
    scene.add(gltf.scene);
    //position scene it lower:
    gltf.scene.position.y = -1.5;
    gltf.add(sound); // add sound to device :))))
    // gltf.animations; // Array<THREE.AnimationClip>
    // gltf.scene; // THREE.Group
    // gltf.scenes; // Array<THREE.Group>
    // gltf.cameras; // Array<THREE.Camera>
    //  gltf.asset; // Object
  },
  // called while loading is progressing
  (xhr) => {
    console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
  },
  // called when loading has errors
  (error) => {
    console.log('An error happened');
  }
);


// ========   Animate my shader: update iTime /in my animation loop(keep the animation running)  ======== //
const clock = new THREE.Clock();

//Draw loop that executes the renderer
const initDraw = () => {

  //update time
  const timePassed = clock.getElapsedTime(); //get time passed since clock started - returns seconds passed and updates iTime
  deviceDisplayPlaneMaterial.uniforms.iTime.value = timePassed; //update iTime in my shader -

  // hover button
   hoverButton(); 

  //
  renderer.render(scene, camera); //draw the scene
  window.requestAnimationFrame(initDraw); //call the draw function again to make it loop :D !
};

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

//listen to click on button
/* document.querySelector('.btn__red').addEventListener('click', () => {
  updateColorInShader(colorOptions[1]);
  console.log(colorOptions[1]);
  console.log('red');
}); */
/* const $btnColors = document.querySelectorAll('.btn__color');
$btnColors.forEach((btn) => {
  btn.addEventListener('click', () => {
    const color = btn.dataset.color;
    updateColorInShader(colorOptions[color]);
    console.log(color);
  });
}); */

const $btnShapes = document.querySelectorAll('.btn__shape');
$btnShapes.forEach((btn) => {
  btn.addEventListener('click', () => {
    const shape = btn.dataset.shape;
    updateShapeInShader(shapeOptions[shape]);
    console.log(shape);
  });
});

// ========   Mouse click   ======== //
let intersectedObjects = []; // Array of objects that intersect with the raycaster

let currentHoveredObject = null;
let lastHoveredObject = null;
function applyHoverMaterial(object) {
  if (!object.originalMaterial) {
    object.originalMaterial = object.material.clone(); // Store the original material
  }


   object.material = new THREE.MeshStandardMaterial({
     
   // color: '#ffff',
    emissive: '#DAAEF7',
     //opacity: 0.5, // 20% opacity which means it's 80% transparent
     //transparent: true,

   });
}

function resetMaterial(object) {
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
       // Reset the color or material of the last hovered object
       resetMaterial(lastHoveredObject);
     }

     // Apply hover effect to the currently hovered object
     applyHoverMaterial(object);

     // Update the lastHoveredObject reference
     lastHoveredObject = object;
   } else {
     if (lastHoveredObject) {
       // If no objects are hovered, reset the last hovered object
       resetMaterial(lastHoveredObject);
       lastHoveredObject = null;
     }
   }
};

const clickButton = (event) => {
  raycaster.setFromCamera(mousePointer, camera); //get raycaster to know where the mouse is pointing
  const intersects = raycaster.intersectObjects(clickableBlenderObjects); //I get all the objects that intersects with the raycaster

  if (intersects.length > 0) {
    const object = intersects[0].object;
    const point = intersects[0].point; // Intersection point in world coordinates + button
    /* if(object.name === ''){
      console.log('Clicked on button');
    } */
    const setTime = 300;

    switch (object.name) {
      case 'btnOFF001':
        console.log('Clicked on button 1');
        updateColorInShader(colorOptions[0]);
        //object.material.color.set(colors.green);
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
        }, 300);
        break;
      case 'btn1001':
        console.log('Clicked on button 1');
        updateColorInShader(colorOptions[0]);
        //object.material.color.set(colors.green);
        object.position.x -= 0.06;
        setTimeout(() => {
          object.position.x += 0.06;
        }, setTime);
        break;
      case 'btn2001':
        console.log('Clicked on button 2');
        updateColorInShader(colorOptions[1]);
        object.position.x -= 0.06;
        setTimeout(() => {
          object.position.x += 0.06;
        }, setTime);
        break;
      case 'btn3001':
        updateColorInShader(colorOptions[2]);
        console.log('Clicked on button 3');
        object.position.x -= 0.06;
        setTimeout(() => {
          object.position.x += 0.06;
        }, setTime);
        break;
      case 'btn4001':
        updateColorInShader(colorOptions[3]);
        console.log('Clicked on button 4');
        object.position.x -= 0.06;
        setTimeout(() => {
          object.position.x += 0.06;
        }, setTime);
        break;
      case 'btnCross001':
        console.log('Clicked on button cross');

        object.worldToLocal(point); //translate the point to local space of the button - can now check if the point is on the left, right, top or bottom of the button

        const left = point.z > 0 && Math.abs(point.x) < Math.abs(point.z); //did .y first but that didn't work. noticed in console that it was z that changed, not y. Is the blue helperline the z axis?
        const right = point.z < 0 && Math.abs(point.x) < Math.abs(point.z);
        const top = point.x < 0 && Math.abs(point.y) < Math.abs(point.x);
        const bottom = point.x > 0 && Math.abs(point.y) < Math.abs(point.x);

        if (object.name === 'btnCross001') {
          if (left) {
            console.log('point', point);
            console.log('LEFT');

            object.rotation.y -= 0.1; //rotate left
            setTimeout(() => {
              object.rotation.y += 0.1;
            }, setTime);
            updateShapeInShader({ incrementNr: 5 });
          } else if (right) {
            console.log('RIGHT');
            object.rotation.y += 0.1; //rotate right
            setTimeout(() => {
              object.rotation.y -= 0.1;
            }, setTime);
            updateShapeInShader({ incrementNr: 55 });
          } else if (bottom) {
            console.log('BOTTOM');
            updateShapeInShader({ incrementNr: 8 });
            object.rotation.z -= 0.1; //rotate down
            setTimeout(() => {
              object.rotation.z += 0.1;
            }, setTime);
          } else if (top) {
            console.log('TOP');
            updateShapeInShader({ incrementNr: 20 });
            console.log(updateShapeInShader);
            object.rotation.z += 0.1; //rotate left
            setTimeout(() => {
              object.rotation.z -= 0.1;
            }, setTime);

            //console.log(updateColorInShader(shapeOptions.incrementNr2));
          }
        }
        //updateShapeInShader(shapeOptions.increment);
        /* object.position.x = 0.1;
        setTimeout(() => {
          object.position.x += 0.1;
        }, setTime); */
        break;
      default:
        console.log(' default - Clicked on button');
        break;
    }
  }
};

$canvas.addEventListener('click', clickButton);



// ========   Raycasting  - store mouse coordinates  ======== //
const onPointerMove = (event) => {
  // calculate pointer position in normalized device coordinates
  // (-1 to +1) for both components

  mousePointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  mousePointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
};

window.addEventListener('pointermove', onPointerMove); //listen to mouse move

window.addEventListener('pointerout', () => {
  if (currentHoveredObject) {
    currentHoveredObject.material.color.set(colorDevice.dark); // Reset to its default color
    currentHoveredObject = null;
  }
});

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
