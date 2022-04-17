import * as THREE from 'three';
import { OrbitControls } from "https://threejs.org/examples/jsm/controls/OrbitControls.js"
import { OBJLoader } from 'https://threejs.org/examples/jsm/loaders/OBJLoader.js'
import { RGBELoader } from 'https://threejs.org/examples/jsm/loaders/RGBELoader.js'
import { MTLLoader } from 'https://threejs.org/examples/jsm/loaders/MTLLoader.js'

// Add timer
let frame = 0

// Initialize scene and renderer
let scene = new THREE.Scene();
scene.background = new THREE.Color( 0xe3eeff )

let camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 10000 );
camera.position.z = 200;

let renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

// Allow draggable controls
let controls = {} // new OrbitControls(camera, renderer.domElement); // Disable orbit controls
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.enableZoom = true;

let keyLight = new THREE.DirectionalLight(new THREE.Color('hsl(30, 100%, 75%)'), 1.0);
keyLight.position.set(-100, 0, 100);

let fillLight = new THREE.DirectionalLight(new THREE.Color('hsl(240, 100%, 75%)'), 0.75);
fillLight.position.set(100, 0, 100);

let backLight = new THREE.DirectionalLight(0xffffff, 1.0);
backLight.position.set(100, 0, -100).normalize();

const light = new THREE.AmbientLight( 0x404040, 15 ); // soft white light

// Add lighting
scene.add( light );
scene.add(keyLight);
scene.add(fillLight);
scene.add(backLight);

// Configure 3D model loaders
let objLoader = new OBJLoader();
let mtlLoader = new MTLLoader()

new RGBELoader()
    .setDataType( THREE.FloatType )
    .setPath( '/three-boilerplate/assets/textures/' )
    .load( 'artist_studio_4k.hdr', function ( texture ) {

    var envMap = pmremGenerator.fromEquirectangular( texture ).texture;

    // scene.background = envMap;
    scene.environment = envMap;

    texture.dispose();
    pmremGenerator.dispose();
})
var pmremGenerator = new THREE.PMREMGenerator( renderer );
pmremGenerator.compileEquirectangularShader();

objLoader.setPath('/three-boilerplate/assets/');
mtlLoader.setPath('/three-boilerplate/assets/');

// Loads an object into the scene, and resolves to that object
const loadObj = (objPath, mtlPath) => {
    return new Promise((resolve) => {
        if(mtlPath) {
            mtlLoader.load(mtlPath, function(materials) {
                objLoader.setMaterials(materials);
                objLoader.load(objPath, function (object) {
                    resolve(object)
                });
            })
        }

        
        objLoader.load(objPath, function (object) {
            resolve(object)
        });
    })
}



function ExplodeAnimation(x,y)
{
  
}

// const geometry = new THREE.BoxGeometry( 100, 100, 100 );
// const material = new THREE.MeshBasicMaterial( {color: 0xff0000} );
// const cube = new THREE.Mesh( geometry, material );

// All possible spawnable clocks
const OBJECTS = [
    { obj: 'blueclock/LP_Classic_Wecker.obj', mtl: 'blueclock/LP_Classic_Wecker.mtl', scaleX: 200, scaleY: 200, scaleZ: 200, },
    // { obj: 'goldclock/LP_Classic_Wecker.obj', mtl: 'goldclock/LP_Classic_Wecker.mtl', scaleX: 200, scaleY: 200, scaleZ: 200, },
    // { obj: '/clock3/Clock_obj.obj', mtl: '/clock3/Clock_obj.mtl', scaleX: 150, scaleY: 150, scaleZ: 150,},
]

const CLOCK_TYPES = [
    { TYPE: 0, POINTS: 5, material: { shininess: 10, color: new THREE.Color( 1, 0, 0 ),    } },
    { TYPE: 1, POINTS: 5, material: { shininess: 10, color: new THREE.Color( 1, 0, 0 ), } },
    { TYPE: 2, POINTS: 5, material: { shininess: 10, color: new THREE.Color( 1, 0, 0 ),  } },
]

// Current list of clocks
const spawnedObjects = []
const createdObjects = []

// Spawns a new clock
async function createObject(options) {
    // Select random object from possible list
    let data = OBJECTS[Math.floor(Math.random() * OBJECTS.length)]
    // Load object into scene
    let object = await loadObj(data.obj, data.mtl)

    // Scale object
    object.scale.x = data.scaleX
    object.scale.y = data.scaleY
    object.scale.z = data.scaleZ

    // Add some metadata about the object
    let createdAt = frame
    let killAt = frame + (options.killAfter || -1) 
    return { object, createdAt, killAt }
}

function randomBetween(a, b) {
    return Math.random() * (a - b) + b
}

function addObject(object, killAfter) {
    // Adjust params 
    object.killAt = frame + (killAfter || 0)
    object.createdAt = frame
    object.aX = randomBetween(-0.5, 0.5)
    object.aY = randomBetween(-0.3, -0.5)
    object.speed = randomBetween(0.3, 0.4)
    object.height = Math.round(randomBetween(0, 150))

    object.x = 1000

    // Add object to scene
    scene.add(object.object);
    spawnedObjects.push(object)

    console.log('Spawned', spawnedObjects)
}

// Load objects
async function initializeClocks(clocksPerType) {
    for(let i = 0; i < CLOCK_TYPES.length; i++) {
        for(let j = 0; j < clocksPerType; j++) {
            let clock = await createObject({ killAfter: 100 })

            let type = CLOCK_TYPES[i]

            // Add specific type properties
            clock.type = type.TYPE
            const mesh = clock.object.children[0]
            let material = mesh.material[1]

            Object.assign(material, type.material)
            material.color = type.material.color

            createdObjects.push(clock)

            scene.add(clock.object)
            clock.object.position.y = -500
            scene.remove(clock.object)
            

            console.log(createdObjects, material)
        }
    }
    return true
}

function addClock(type, duration=200) {
    // Try to find an available clock to add
    let clock = createdObjects.find(obj => !obj.object.parent && obj.type === type)
    if(!clock) return false
    addObject(clock, duration)
    return true
}

function killClock(i, x, y) {
    scene.remove(spawnedObjects[i].object)
    spawnedObjects.splice(i, 1)

    //let explosion = new ExplodeAnimation(x, y)
    //setTimeout(() => scene.remove(explosion.object), 1000)
}

;(async function() {
    // Create all possible clocks and cache them
    await initializeClocks(2)
    // Add a clock of type 0 for 200 frames. If there are no clocks available, this returns false
    console.log(addClock(0, 200))

    let FRAME_DELAY = 400

    // Animation loop
    let animate = function () {
        requestAnimationFrame( animate );
        frame++

        // Spawn in a new clock
        if(frame % FRAME_DELAY === 0) {
            console.log(frame)
            const clockType = Math.floor(randomBetween(0, CLOCK_TYPES.length))
            console.log(`Adding clock ${clockType} was successful:`, addClock(clockType, 200))
            FRAME_DELAY -= 1
        }

        // controls.update();
        
        // Spawns an moves
        for(let i in spawnedObjects) {
            let object = spawnedObjects[i]
            let objectPos = object.object.position
            // console.log(collisionDetection(cursorPos, objectPos)))
            // console.log(render(object))
            // removes object if collision detected or time runs out
            if(frame === object.killAt) {
                scene.remove(object.object)
                spawnedObjects.splice(i, 1)
                i--
                continue
            } else if (collision(object, pointer.x, pointer.y)) {
                killClock(i, pointer.x, pointer.y)
                i--
            }
            
            moveParabolic(object.object, object.aX, object.aY, object.height, (frame - object.createdAt - 100),  object.speed)
            rotateObject(object.object)
        }

        renderer.render(scene, camera);
    };
    animate();
})()

// function collisionDetection(vec1, vec2, dist=35) {
//     // Checks if two objects or vectors collide
//     // Takes two position vectors (accessible through a spawned object's object.object.pos)
//     if(!vec1.x || !vec2.x) return false; // Check that both vectors are valid


//     let xDiff = Math.abs(vec1.x - vec2.x)
//     let yDiff = Math.abs(vec1.y - vec2.y)

//     let euclidDist = Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2))

//     // TODO: if necessary: determine if z's collide
//     // TODO: decide if euclidean Dist or just simple xDiff and yDiff is better/easier

//     // return xDiff < dist && yDiff < dist
//     return euclidDist < dist
// }



// Move parabolically as a function of time

function moveParabolic(object, ax, ay, height, t, speed) {
    t *= speed
    let x = 2 * ax * t, y = ay * t ** 2 + height
    object.position.x = x
    object.position.y = y
}

// Rotates Object
function rotateObject(object, rad) {
    object.rotation.y +=  (0.03 - 0.01) + 0.01
    object.rotation.z +=  (0.03 - 0.01) + 0.01
    object.rotation.x +=  (0.03 - 0.01) + 0.01

    if (object.rotation.x > 2 * Math.PI) object.rotation.x = 0
    if (object.rotation.y > 2 * Math.PI) object.rotation.y = 0
    if (object.rotation.z > 2 * Math.PI) object.rotation.z = 0
}


// edmund's workspace
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector3();
// var vec = new THREE.Vector3(); // create once and reuse
// var cursorPos = new THREE.Vector3(); // create once and reuse

function onPointerMove(event) {

	// calculate pointer position in normalized device coordinates
	// (-1 to +1) for both components

	pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

function collision(object, x, y) {

    let pointer = new THREE.Vector2(x, y)

	// update the picking ray with the camera and pointer position
	raycaster.setFromCamera(pointer, camera );

	// calculate objects intersecting the picking ray
	const intersects = raycaster.intersectObjects( scene.children );

	for ( let i = 0; i < intersects.length; i ++ ) {
        if(intersects[i].object == object.object.children[0]) return intersects[i].object;
	}

    return false;
}

window.addEventListener( 'pointermove', onPointerMove );