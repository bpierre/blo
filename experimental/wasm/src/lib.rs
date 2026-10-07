#![cfg_attr(target_arch = "wasm32", no_std)]

// Match JavaScript's wrapping Uint32Array arithmetic and SIGNED right shifts.
// A logical right shift here would generate completely different icons.
struct Random([u32; 4]);

impl Random {
    fn new(seed: &[u16]) -> Self {
        let mut state = [0u32; 4];
        let mut chunks = seed.chunks_exact(4);
        for chunk in chunks.by_ref() {
            state[0] = state[0].wrapping_mul(31).wrapping_add(chunk[0] as u32);
            state[1] = state[1].wrapping_mul(31).wrapping_add(chunk[1] as u32);
            state[2] = state[2].wrapping_mul(31).wrapping_add(chunk[2] as u32);
            state[3] = state[3].wrapping_mul(31).wrapping_add(chunk[3] as u32);
        }
        for (i, &ch) in chunks.remainder().iter().enumerate() {
            state[i] = state[i].wrapping_mul(31).wrapping_add(ch as u32);
        }
        Self(state)
    }

    #[inline(always)]
    fn next(&mut self) -> u32 {
        let t = self.0[0] ^ (self.0[0] << 11);
        let w = self.0[3];
        self.0 = [
            self.0[1],
            self.0[2],
            w,
            w ^ ((w as i32 >> 19) as u32) ^ t ^ ((t as i32 >> 8) as u32),
        ];
        self.0[3]
    }

    fn color(&mut self) -> [u16; 3] {
        // These operations are exact in JS f64: random values have denominator
        // 2^31 and all integer intermediates fit within f64's 53-bit precision.
        // Integer arithmetic gives the same truncation without float conversions.
        let hue = ((self.next() as u64 * 360) >> 31) as u16;
        let saturation = 40 + ((self.next() as u64 * 60) >> 31) as u16;
        let lightness =
            (((self.next() as u64 + self.next() as u64 + self.next() as u64 + self.next() as u64)
                * 25)
                >> 31) as u16;
        [hue, saturation, lightness]
    }
}

struct Image {
    pixels: [u8; 32],
    palette: [[u16; 3]; 3],
}

fn image(seed: &[u16]) -> Image {
    let mut random = Random::new(seed);
    let color = random.color();
    let background = random.color();
    let spot = random.color();
    let mut pixels = [0u8; 32];
    for pixel in &mut pixels {
        let value = random.next();
        // Exact boundaries for floor((value / 2^31) * 2.3).
        *pixel = u8::from(value >= 933_688_543) + u8::from(value >= 1_867_377_086);
    }
    Image {
        pixels,
        palette: [background, color, spot],
    }
}

struct Writer<'a> {
    bytes: &'a mut [u8],
    len: usize,
}

impl<'a> Writer<'a> {
    fn new(bytes: &'a mut [u8]) -> Self {
        Self { bytes, len: 0 }
    }

    #[inline]
    fn push(&mut self, bytes: &[u8]) {
        self.bytes[self.len..self.len + bytes.len()].copy_from_slice(bytes);
        self.len += bytes.len();
    }

    #[inline]
    fn number(&mut self, n: u16) {
        if n >= 100 {
            self.push(&[b'0' + (n / 100) as u8]);
        }
        if n >= 10 {
            self.push(&[b'0' + ((n / 10) % 10) as u8]);
        }
        self.push(&[b'0' + (n % 10) as u8]);
    }
}

// Precompute both mirrored squares at compile time.
const SQUARES: [[u8; 24]; 32] = {
    let mut squares = [*b"M0,0h1v1h-1zM7,0h1v1h-1z"; 32];
    let mut i = 0;
    while i < 32 {
        squares[i][1] = b'0' + (i & 3) as u8;
        squares[i][3] = b'0' + (i >> 2) as u8;
        squares[i][13] = b'0' + (7 - (i & 3)) as u8;
        squares[i][15] = b'0' + (i >> 2) as u8;
        i += 1;
    }
    squares
};

fn svg(image: &Image, size: &[u8], output: &mut [u8]) -> usize {
    let mut out = Writer::new(output);
    out.push(b"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 8 8\" shape-rendering=\"optimizeSpeed\" width=\"");
    out.push(size);
    out.push(b"\" height=\"");
    out.push(size);
    out.push(b"\">");
    for (index, color) in image.palette.iter().enumerate() {
        out.push(b"<path fill=\"hsl(");
        out.number(color[0]);
        out.push(b" ");
        out.number(color[1]);
        out.push(b"% ");
        out.number(color[2]);
        out.push(b"%)\" d=\"");
        if index == 0 {
            out.push(b"M0,0H8V8H0z");
        } else {
            for (i, &pixel) in image.pixels.iter().enumerate() {
                if pixel == index as u8 {
                    out.push(&SQUARES[i]);
                }
            }
        }
        out.push(b"\"/>");
    }
    out.push(b"</svg>");
    out.len
}

const BASE64: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

fn data_uri(input: &[u8], output: &mut [u8]) -> usize {
    const PREFIX: &[u8] = b"data:image/svg+xml;base64,";
    output[..PREFIX.len()].copy_from_slice(PREFIX);
    let len = PREFIX.len() + input.len().div_ceil(3) * 4;
    let mut chunks = input.chunks_exact(3);
    let mut groups = output[PREFIX.len()..len].chunks_exact_mut(4);
    for (chunk, group) in chunks.by_ref().zip(groups.by_ref()) {
        let a = chunk[0] as usize;
        let b = chunk[1] as usize;
        let c = chunk[2] as usize;
        group.copy_from_slice(&[
            BASE64[a >> 2],
            BASE64[((a & 3) << 4) | (b >> 4)],
            BASE64[((b & 15) << 2) | (c >> 6)],
            BASE64[c & 63],
        ]);
    }
    let remainder = chunks.remainder();
    if let Some(group) = groups.next() {
        let a = remainder[0] as usize;
        let b = remainder.get(1).copied().unwrap_or(0) as usize;
        group.copy_from_slice(&[
            BASE64[a >> 2],
            BASE64[((a & 3) << 4) | (b >> 4)],
            if remainder.len() == 2 {
                BASE64[(b & 15) << 2]
            } else {
                b'='
            },
            b'=',
        ]);
    }
    len
}

// One instance has one scratch area. Calls are synchronous; the JS adapter copies
// all returned data so later calls cannot mutate a previously returned image.
const SEED_CAPACITY: usize = 65536;
const SIZE_CAPACITY: usize = 32;
const SVG_CAPACITY: usize = 1536;
const URI_CAPACITY: usize = 25 + SVG_CAPACITY.div_ceil(3) * 4;

static mut SEED: [u16; SEED_CAPACITY] = [0; SEED_CAPACITY];
static mut SIZE: [u8; SIZE_CAPACITY] = [0; SIZE_CAPACITY];
static mut IMAGE: [u8; 50] = [0; 50];
static mut SVG: [u8; SVG_CAPACITY] = [0; SVG_CAPACITY];
static mut URI: [u8; URI_CAPACITY] = [0; URI_CAPACITY];

#[no_mangle]
pub extern "C" fn seed_ptr() -> *mut u16 {
    core::ptr::addr_of_mut!(SEED).cast()
}
#[no_mangle]
pub extern "C" fn size_ptr() -> *mut u8 {
    core::ptr::addr_of_mut!(SIZE).cast()
}
#[no_mangle]
pub extern "C" fn image_ptr() -> *mut u8 {
    core::ptr::addr_of_mut!(IMAGE).cast()
}
#[no_mangle]
pub extern "C" fn svg_ptr() -> *mut u8 {
    core::ptr::addr_of_mut!(SVG).cast()
}
#[no_mangle]
pub extern "C" fn uri_ptr() -> *mut u8 {
    core::ptr::addr_of_mut!(URI).cast()
}
#[no_mangle]
pub extern "C" fn seed_capacity() -> usize {
    SEED_CAPACITY
}

// Only the adapter calls this ABI. Bounds are still checked before constructing
// slices so invalid lengths cannot read or write outside the scratch buffers.
#[no_mangle]
pub extern "C" fn render(seed_len: usize, size_len: usize, mode: u32) -> usize {
    assert!(seed_len <= SEED_CAPACITY && size_len <= SIZE_CAPACITY && mode <= 2);
    // SAFETY: buffers are disjoint, lengths were checked, and the synchronous
    // Wasm instance has no threads or callbacks into JavaScript.
    unsafe {
        let seed = core::slice::from_raw_parts(seed_ptr(), seed_len);
        let image = image(seed);
        if mode == 0 {
            let output = core::slice::from_raw_parts_mut(image_ptr(), 50);
            output[..32].copy_from_slice(&image.pixels);
            for (i, &value) in image.palette.iter().flatten().enumerate() {
                output[32 + i * 2..34 + i * 2].copy_from_slice(&value.to_le_bytes());
            }
            return 50;
        }
        let size = core::slice::from_raw_parts(size_ptr(), size_len);
        let svg_output = core::slice::from_raw_parts_mut(svg_ptr(), SVG_CAPACITY);
        let len = svg(&image, size, svg_output);
        if mode == 1 {
            len
        } else {
            let output = core::slice::from_raw_parts_mut(uri_ptr(), URI_CAPACITY);
            data_uri(&svg_output[..len], output)
        }
    }
}

#[cfg(target_arch = "wasm32")]
#[panic_handler]
fn panic(_: &core::panic::PanicInfo<'_>) -> ! {
    core::arch::wasm32::unreachable()
}
