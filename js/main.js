import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
//import { GLTFLoader } from 'three/addons/GLTFLoader.js'; // I get network error if I use this one
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'; //use this until I ask the teacher

import portalVertexShader from './shaders/portal/vertex.glsl?raw'; //vite doesn't know about gls. Will get an error so: Will add ? and specify raw (tell it's just a string)
import portalFragmentShader from './shaders/portal/fragment.glsl?raw';

const $canvas = document.querySelector('.webglCanvas');
const scene = new THREE.Scene();
scene.add(new THREE.AxesHelper(2)); //remember to comment out

scene.background = new THREE.Color('#89A4BF'); //('#d9b99b')

/* const textureLoader = new THREE.TextureLoader();
scene.background = textureLoader.load('path/to/your/texture.jpg'); */

// ========   FLOOR   ======== //

const floorGeometry = new THREE.PlaneGeometry(20, 20, 10, 10); //create a plane
const floorMaterial = new THREE.MeshBasicMaterial({
  color: '#242B32',
  side: THREE.DoubleSide,
  //wireframe: true,
}); //create a material
/* const floorTexture = new THREE.TextureLoader().load('assets/floor.jpg'); //load texture */
//floorMaterial.map = floorTexture; //assign texture to material
const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial); //create a mesh
floorMesh.receiveShadow = true; //receive shadows
floorMesh.rotation.x = Math.PI * -0.5; //rotate the floor 90 degrees
floorMesh.position.y = -2; //move the floor down
//round corners
const radius = 0.5;

scene.add(floorMesh); //add the floor to the scene

// ========   LIGHT   ======== //
const light = new THREE.SpotLight();
light.position.set(5, 5, 5);
scene.add(light);

/* const light = new THREE.SpotLight(0xffffff, 1000);
light.position.set(12.5, 12.5, 12.5);
light.castShadow = true;
light.shadow.mapSize.width = 1024;
light.shadow.mapSize.height = 1024;
scene.add(light); */

//https://threejs.org/docs/#api/en/core/Raycaster
const raycaster = new THREE.Raycaster();
const mousePointer = new THREE.Vector2();

const size = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const camera = new THREE.PerspectiveCamera(
  40,
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
  antialias: true, //smooth edges?
});
//renderer.shadowMap.enabled = true;

//set size of renderer to size object at top.
renderer.setSize(size.width, size.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// ========   BAKED   ======== //
const textureBlender = new THREE.TextureLoader().load(
  'assets/bakedTesting.jpg'
);
textureBlender.flipY = false; //y axis of textures I load is inverted. This is boolean... not -1
const material = new THREE.MeshBasicMaterial({ map: textureBlender });

//CHECK documentation: shader material
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
  'assets/gameDeviceFour.glb',
  // called when the resource is loaded
  (gltf) => {
    console.log('gltf:', gltf);
    //loop through each of the children (assign the model to all of the children):
    gltf.scene.traverse((child) => {
      console.log('traverse, blender child name:', child.name);
      if (child.name === 'screenShader001') {
        //display shaderToy on device screen
        child.material = deviceDisplayPlaneMaterial;
      } else {
        child.material = material; //child of material, is same as material
      }

      //CONTINUE
      console.log('isMesh:', child.isMesh);
      if (child.isMesh) {
        switch (child.name) {
          case 'btn1001':
            console.log('btn1001');
            clickableBlenderObjects.push(child);
            break;
          case 'btn2001':
            console.log('btn2');
            clickableBlenderObjects.push(child);
            break;
          case 'btn3001':
            console.log('btn301');
            clickableBlenderObjects.push(child);
            break;
          case 'btn4001':
            console.log('btn401');
            clickableBlenderObjects.push(child);
            break;
        } //switch case for each mesh - btns to click on > push to array clickableBlenderObjects
      }
    });
    scene.add(gltf.scene);
    //position scene it lower:
    gltf.scene.position.y = -1.5;
    gltf.scene.castShadow = true; //get this to work with light source later.  -need to pick the device?

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

//test object: create simple cube
//const geometry = new THREE.BoxGeometry(1, 1, 1);

/* const cube = new THREE.Mesh(geometry, material);
scene.add(cube);
console.log(cube); */

// ========   Animate my shader: update iTime /in my animation loop(keep the animation running)  ======== //
const clock = new THREE.Clock();

//Draw loop that executes the renderer
const initDraw = () => {
  //decrease touch effect over time
  deviceDisplayPlaneMaterial.uniforms.touchEffect.value *= 1.0;

  //update time
  const timePassed = clock.getElapsedTime(); //get time passed since clock started - returns seconds passed and updates iTime
  deviceDisplayPlaneMaterial.uniforms.iTime.value = timePassed; //update iTime in my shader -

  // hover button
  //hoverButton();

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

const shapeOptions = {
  default: { incrementNr: 8 },
  increment: { incrementNr: 20 },
};

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
const $btnColors = document.querySelectorAll('.btn__color');
$btnColors.forEach((btn) => {
  btn.addEventListener('click', () => {
    const color = btn.dataset.color;
    updateColorInShader(colorOptions[color]);
    console.log(color);
  });
});

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
const hoverButton = () => {
  //make transparent
  raycaster.setFromCamera(mousePointer, camera); //get raycaster to know where the mouse is pointing
  const intersects = raycaster.intersectObjects(clickableBlenderObjects); //-> the 3d obj I choose     //(scene.children, true); //get all the objects that intersects with the raycaster
  //loop the intersects

  // Reset all previously intersected objects
  intersectedObjects.forEach((object) => {
    object.material.transparent = false;
    object.material.opacity = 1;
  });

  intersectedObjects = []; // Clear the array

  // Set transparency for currently intersected objects
  for (let i = 0; i < intersects.length; i++) {
    intersects[i].object.material.transparent = true;
    intersects[i].object.material.opacity = 0.5;
    intersectedObjects.push(intersects[i].object); // Add to array for next frame
  }
  console.log(intersectedObjects);
};

const clickButton = (event) => {
  raycaster.setFromCamera(mousePointer, camera); //get raycaster to know where the mouse is pointing
  const intersects = raycaster.intersectObjects(clickableBlenderObjects); //I get all the objects that intersects with the raycaster

  if (intersects.length > 0) {
    const object = intersects[0].object;
    /* if(object.name === ''){
      console.log('Clicked on button');
    } */
    switch (object.name) {
      case 'btn1001':
        console.log('Clicked on button 1');
        break;
      case 'btn2001':
        console.log('Clicked on button 2');
        break;
      case 'btn3001':
        console.log('Clicked on button 3');
        break;
      case 'btn4001':
        console.log('Clicked on button 4');
        break;
      default:
        console.log(' default - Clicked on button');
        break;
    }
  }
};

$canvas.addEventListener('click', clickButton);

// ========   Mouse move   ======== //

/* $canvas.addEventListener('mousemove', (event) => {
  deviceDisplayPlaneMaterial.uniforms.iMouse.value.x = event.clientX;
  deviceDisplayPlaneMaterial.uniforms.iMouse.value.y = event.clientY;
  deviceDisplayPlaneMaterial.uniforms.touchEffect.value = 1.0;
}); */

// ========   Raycasting  - store mouse coordinates  ======== //
const onPointerMove = (event) => {
  // calculate pointer position in normalized device coordinates
  // (-1 to +1) for both components

  mousePointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  mousePointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
};

window.addEventListener('pointermove', onPointerMove); //listen to mouse move

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
