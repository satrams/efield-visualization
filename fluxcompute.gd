extends Node

var rd : RenderingDevice = RenderingServer.create_local_rendering_device();
var shader_file = load("res://fluxcalculation.glsl");
var shader_spirv = shader_file.get_spirv();
var shader = rd.shader_create_from_spirv(shader_spirv);
var pipeline = rd.compute_pipeline_create(shader);
var bindings : Array;
var uniform_set;
var output_verts_id : RID;

# Called when the node enters the scene tree for the first time.
func _ready():
	
	pass # Replace with function body.


# Called every frame. 'delta' is the elapsed time since the previous frame.
func _process(delta):
	
	var compute_list = rd.compute_list_begin();
	
	rd.compute_list_bind_compute_pipeline(compute_list, pipeline);
	
	rd.compute_list_bind_uniform_set(compute_list, uniform_set, 0);

	rd.compute_list_dispatch(compute_list, 1, 1, 1);
	
	
	# Tell the GPU we are done with this compute task
	rd.compute_list_end()
	# Force the GPU to start our commands
	rd.submit()
	# Force the CPU to wait for the GPU to finish with the recorded commands
	rd.sync()
	pass
