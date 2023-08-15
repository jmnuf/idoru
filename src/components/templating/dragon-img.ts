// Image gotten from https://unicode.org/emoji/charts/full-emoji-list.html#1f409
export function DragonImg(width: number = 25) {
	if (!Number.isFinite(width)) {
		console.error("Expected a finite number for dragon image size. Resetting to 25");
		width = 25;
	} else if (!Number.isSafeInteger(width)) {
		width = Math.min(Math.abs(Math.floor(width)), Number.MAX_SAFE_INTEGER / 2);
		console.error("Expected a safe integer for dragon image size.", `Fixed value to ${width}`);
	} else if (width < 0) {
		console.warn("Expected the width for dragon image to be a positive number. Flipping signs");
		width = Math.abs(width);
	}
	return `<img alt="🐉" width="${width}px" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEgAAABICAMAAABiM0N1AAAAXVBMVEVHcEwAAAAAAAAAAAAAAAAAAAAAAAALDAEAAAAAAABzqiT3Ywy62Ao5UxCWvRUiLwdqnSFWcRCszA2HoBnXYAz8uACQPwZfixy6ghUzFwKbkBtgKQTcowGEhIT///+rWBJ2AAAACnRSTlMAJUn/dsCX+greKAxyNwAAAvdJREFUWMPtl+12oyAQhmtQEQyi4qrRtvd/mQVEvklCsn92T9+epknaPmfmHWaGfHz86n9SU1YIAqV3MBryFqipAPgrII8Dck1x0oHz5x+hXFCB3CBuB+ZzFy8aqefi8TiQc1b4QoKl58rMo7m94pSwl/ZAPmIukZj4iftMkMiix0A+CnFOJ58MmSDxh1gJUmw0tVKvgHqDxJviTG+C1lZpfik1alI7STAL9PX99Q3ognFg0Z5nNvjiXwA4pE0YdMusmhJ1Qmp11WAuCDqgVYNQxoGMaNPlRxktEgExXf76laaFVy7LJFG2suBjHD06CN4YGThntCKScPPre7PJGWxEBNQZ0AwCoaosUqNW159dTWbb2WkR1cW9zUEOjApIgs4Jt8/T1DpWXpKbg3RXhyN6ZFfLwAwUozLg1PKPVTTKaGmRapD9HAScyONqp/l434/pIs0ZFaYzB1v5PJ+cVhOPEkDPJ2Q4nXUcB+hzbElSHZ7H0UnKHth726ZJhe/04Iez0HNZynZbN8YwY9s6GdLN87sQyY4upye6NPw/V2b3nzOCKy8z4uZlMDyxNWhlaykgr/bMDmiwt/UWGy9rdE2JmnW6K4w5IDVcNCkCGjVosTELTmmKgEQipk/pMxg1FyIgE9HpDxzwXa2PPFIREfxALARVTtV6ERIJPV4Icd+dAlDtTFde/SGCoUGUa7DvRO9T43ZExzkn/qqavQPZQGXSmOCQqGtM9lrtNy3xm9YIJty/Bd0v5xpLklJVDOfRsWlHbzw6/2A4unTiogqbO6NWywKJw9nJbwLsuVdFhz/tUqCBP+/kNzH3HhK7Eai1NlgYRh2PzD63MgPhZrsoR7tRJDiOYiRFQcQOCCVuEcQ5OSQG0m8u8QVZ3eEYECR6sCzicKEm6rVdGZ/KXy99sPF8h5rLYbSpTMCBS9h6YWIFDK4sbnQA9iEmLL3/6TGIzpQcLwOhqZuI/5n6OaFL/EaTKVg2WZ9IE6oeYJ7gQFTVqVvor/41/QCaT1523CbBwAAAAABJRU5ErkJggg==" />`;
}