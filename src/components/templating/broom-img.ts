// Image gotten from https://unicode.org/emoji/charts/full-emoji-list.html#1f9f9
export function BroomImg(width: number = 25) {
	if (!Number.isFinite(width)) {
		console.error("Expected a finite number for broom image size. Resetting to 25");
		width = 25;
	} else if (!Number.isSafeInteger(width)) {
		width = Math.min(Math.abs(Math.floor(width)), Number.MAX_SAFE_INTEGER / 2);
		console.error("Expected a safe integer for broom image size.", `Fixed value to ${width}`);
	} else if (width < 0) {
		console.warn("Expected the width for broom image to be a positive number. Flipping signs");
		width = Math.abs(width);
	}
	return `<img alt="🧹" width="${width}px" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEgAAABICAMAAABiM0N1AAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAABmUExURUdwTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAI5UKf/XevTCWdmSAeykAjUcCS0YB/zLcNo3At5KBndIAfK5PeNcFdWNAHhgKZR8RFohDcgQFrl5BqhxAMChW5B5QVM5e6EAAAALdFJOUwBFpMsn5x7y3TR7fEfEXQAAAWdJREFUWMPt1duygiAUgGFPBYoH2ihu22r1/i+ZoKJgF8iymX3humqy+eZfOKnnnfPNSTAhOAEz0cCIwRHQuZBp8EEOIQnYuaXpDyxJOWkqPhzhgKC1I1YLD3JcD3vjhAc5+Ho6p3M6p/NFJw4wQjjwgc41VC8/jACOj4g+/8Jpn4w9W7jzyuS8eN9ziMPzEcrqpml6gFNWuuTo/LFfXeKOPSwzpMfw7cVlL1N67Hsxr/bSJdrugiZnKKgMKZdn5O918iI3m+htuBTsd8wmRu0PSXPMppwW4ra5OHoTtYZi09Gaamq9Wrh1lqayoNaHjbaOaqq6rpC3P7aE7qYzNtW07ORjyeruB+KXd8ORTWIv6dj91SJ52NsmVnYdlXuh2PLtgz41ZTXtxr1sHSWZzrSXvfOpSTp8r7NtcnXMJndHb4I46yaYszRBHSWBnVniYEdJYGeW4M4iQZ1ZgjvDUyVAKIi8c46eNy4CSzJlbiu3AAAAAElFTkSuQmCC" />`;
}