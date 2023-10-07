//https://www.shadertoy.com/view/tsXBzS


//Unforms for interactions
uniform int u_shapeMapIncrementNr;
uniform vec4 u_backgroundColor;
uniform vec3 u_color1;
uniform vec3 u_color2;
//uniform float u_distance; 

//pass uniforms to the fragment shader
uniform float iTime;
uniform vec2 iResolution;
precision mediump float; //indicate medium precision for float - to work on e.g. mobile devices 


varying vec2 vUv; 


vec3 palette(float d){
    return mix(u_color1, u_color2, d);
    //return mix(vec3(0.4235, 0.5843, 0.4588),vec3(0.8667, 0.7686, 0.4392), d);
    //return mix(vec3(0.2,0.7,0.9),vec3(1.,0.,1.),d);
}

vec2 rotate(vec2 p,float a){
	float c = cos(a);
    float s = sin(a);
    return p*mat2(c,s,-s,c);
}

//shape defined here
//p= position of the ray
float map(vec3 p){
    for( int i = 0; i<u_shapeMapIncrementNr; ++i){    //can adjust increment 
        float t = iTime*0.1; //adjusted time, it was too fast - from 2 to 1
        //p.xz =rotate(p.xz,t);
        p.xz =rotate(p.xz,t*1.25); //adjust to change the rotation speed
        //p.xy =rotate(p.xy,t*1.89);
        p.xy =rotate(p.xy,t*2.0);
        p.xz = abs(p.xz);
        //p.xz-=.6;
        p.xz-=.2; //adjust to change the shape of the pyramid
	}
	return dot(sign(p),p)/6.;
}

// RAY MARCH
//rm = ray march
//ro = ray origin 
//rd = ray direction 
vec4 rm (vec3 ro, vec3 rd){
    float t = 3.;              //t = total distance
    vec3 col = vec3(0.);
    float d; 
    for(float i =0.; i<80.; i++){
		vec3 p = ro + rd*t;
        d = map(p)*.9;    //d = distance 
        if(d<0.0){     //adjust value to change the size of the shape 
            break;
        }
        if(d>100.){
        	break;
        }
        col =0.9 * col + palette(length(p)*.5)/(500.*(d));  // 0.9*col to make it more transparent
        
        t+=d;
    }
    
    return vec4(col,1./(d*100.));
}



void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = (fragCoord-(iResolution.xy/2.))/iResolution.x;
	//vec3 ro = vec3(0.,0.,-50.);       
    vec3 ro = vec3(1.,1.,-30.);     //adjust to change the distance of the camera to the shape  
    ro.xz = rotate(ro.xz,iTime);
    vec3 cf = normalize(-ro); //cf = camera forward
    vec3 cs = normalize(cross(cf,vec3(0.,1.,0.))); //cs = camera side
    vec3 cu = normalize(cross(cf,cs)); //cu = camera up
    
    vec3 uuv = ro+cf*3. + uv.x*cs + uv.y*cu; //uuv = uv coordinates 
    vec3 rd = normalize(uuv-ro); //rd = ray direction
    vec4 col = rm(ro,rd); 
    
    // Check the distance and set background + access alpha col.a
    if(col.a > 0.2) {
        fragColor = col; // Set the fragment color
    } else {
        fragColor = u_backgroundColor; 
    }
}

void main()
{
  vec2 fragCoord = iResolution * vUv;
  mainImage(gl_FragColor, fragCoord);
}


/** SHADERDATA
{
	"title": "fractal pyramid",
	"description": "",
	"model": "car"
}
*/

