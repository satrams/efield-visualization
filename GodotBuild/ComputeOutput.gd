extends TextureRect

const image_size : Vector2i = Vector2i(768,768);

# Called when the node enters the scene tree for the first time.
func _ready():
	var image = Image.create(image_size.x, image_size.y, false, Image.FORMAT_RGBAF);
	var image_texture = ImageTexture.create_from_image(image);
	texture = image_texture;


# Called every frame. 'delta' is the elapsed time since the previous frame.
func _process(delta):
	pass

func set_data(data : PackedByteArray):
	var image := Image.create_from_data(image_size.x, image_size.y, false, Image.FORMAT_RGBAF, data);
	texture.update(image);
