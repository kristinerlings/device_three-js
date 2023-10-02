import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
//import { GLTFLoader } from 'three/addons/GLTFLoader.js'; // I get network error if I use this one
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'; //use this until I ask the teacher

import portalVertexShader from './shaders/portal/vertex.glsl?raw'; //vite doesn't know about gls. Will get an error so: Will add ? and specify raw (tell it's just a string)
import portalFragmentShader from './shaders/portal/fragment.glsl?raw';

const $canvas = document.querySelector('.webglCanvas');
const scene = new THREE.Scene();

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
//look at the uniforms in the fragment shader (currently I have all of them, need to work this out). iTime and iResolution are the ones I need to pass in.
//Pass in iTime and iResolution as uniforms to my shader material: (iTime is a float, iResolution is a vector2)
const deviceDisplayPlaneMaterial = new THREE.ShaderMaterial({
  uniforms: {
    iTime: { value: 0.0 },
    iResolution: { value: new THREE.Vector2(size.width, size.height) },
    iMouse: { value: new THREE.Vector2() },
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
    });
    scene.add(gltf.scene);
    //position scene it lower:
    gltf.scene.position.y = -1.5;

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
const clock = new THREE.Clock(); //to get the time

//Draw loop that executes the renderer
const initDraw = () => {
  //decrease touch effect over time
  deviceDisplayPlaneMaterial.uniforms.touchEffect.value *= 1.0;

  //update time
  const timePassed = clock.getElapsedTime(); //get time passed since clock started - returns seconds passed and updates iTime
  deviceDisplayPlaneMaterial.uniforms.iTime.value = timePassed; //update iTime in my shader -

  //
  renderer.render(scene, camera); //draw the scene
  window.requestAnimationFrame(initDraw); //call the draw function again to make it loop :D !
};

// ======== CHANGE COLORS ======= //
const colorOptions = [
  {
    backgroundColor: new THREE.Vector4(0.0, 0.3, 0.65, 0.6),
    color1: new THREE.Color(0x00ff00), //red
    color2: new THREE.Color(0x00ff00), //green
  },
  {
    backgroundColor: new THREE.Vector4(0.5, 0.2, 0.75, 0.9), 
    color1: new THREE.Color(0x0000ff), //blue
    color2: new THREE.Color(0xffa500), //orange
  },
  {
    backgroundColor: new THREE.Vector4(0.1, 0.8, 0.25, 0.3),
    color1: new THREE.Color(0x00ffff), // cyan
    color2: new THREE.Color(0xff0000), // red
  },
  {
    backgroundColor: new THREE.Vector4(0.9, 0.1, 0.25, 0.3), 
    color1: new THREE.Color(0x00ff00), // green
    color2: new THREE.Color(0x0000ff), //blue
  },
];

const shapeOptions = {
  default: { incrementNr: 8 },
  increment: { incrementNr: 20 }
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
  }

//listen to click on button
/* document.querySelector('.btn__red').addEventListener('click', () => {
  updateColorInShader(colorOptions[1]);
  console.log(colorOptions[1]);
  console.log('red');
}); */
const $btnColors = document.querySelectorAll('.btn__color');
$btnColors.forEach(btn => {
  btn.addEventListener('click', () => {
    const color = btn.dataset.color;
    updateColorInShader(colorOptions[color]);
    console.log(color);
  })
})

const $btnShapes = document.querySelectorAll('.btn__shape');
$btnShapes.forEach(btn => {
  btn.addEventListener('click', () => {
    const shape = btn.dataset.shape;
    updateShapeInShader(shapeOptions[shape]);
    console.log(shape);
  })
});


// ========   Mouse move   ======== //

$canvas.addEventListener('mousemove', (event) => {
  deviceDisplayPlaneMaterial.uniforms.iMouse.value.x = event.clientX;
  deviceDisplayPlaneMaterial.uniforms.iMouse.value.y = event.clientY;
  deviceDisplayPlaneMaterial.uniforms.touchEffect.value = 1.0;
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
