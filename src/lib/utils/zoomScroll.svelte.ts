export function scrollZoom(
	node: HTMLElement,
	{ maxScale, factor }: { maxScale: number; factor: number }
) {
	let target: HTMLElement;
	let size = { w: 0, h: 0 };
	let pos = { x: 0, y: 0 };
	let zoomTarget = { x: 0, y: 0 };
	let zoomPoint = { x: 0, y: 0 };
	let scale = 1;
	let isDragging = false;
	let dragStart = { x: 0, y: 0 };

	$effect(() => {
		target = node.children[0] as HTMLElement;
		size = { w: target.offsetWidth, h: target.offsetHeight };

		target.style.transformOrigin = '0 0';

		function scrolled(e: WheelEvent) {
			if (!e.ctrlKey) return;
			const offset = node.getBoundingClientRect();
			zoomPoint.x = e.pageX - offset.left;
			zoomPoint.y = e.pageY - offset.top;

			e.preventDefault();
			const delta = -(e.deltaY || e.detail);

			// Cap the delta to [-1, 1] for cross-browser consistency
			const clampedDelta = Math.max(-1, Math.min(1, delta));

			// Determine the point on where the slide is zoomed in
			zoomTarget.x = (zoomPoint.x - pos.x) / scale;
			zoomTarget.y = (zoomPoint.y - pos.y) / scale;

			// Apply zoom
			scale += clampedDelta * factor * scale;
			scale = Math.max(1, Math.min(maxScale, scale));

			// Calculate x and y based on zoom
			pos.x = -zoomTarget.x * scale + zoomPoint.x;
			pos.y = -zoomTarget.y * scale + zoomPoint.y;

			// Recenter on zoom out
			if (scale < 1) {
				pos.x = (size.w - size.w * scale) / 2;
				pos.y = (size.h - size.h * scale) / 2;
			}

			// Make sure the slide stays in its container area
			if (pos.x > 0) pos.x = 0;
			if (pos.x + size.w * scale < size.w) pos.x = -size.w * (scale - 1);
			if (pos.y > 0) pos.y = 0;
			if (pos.y + size.h * scale < size.h) pos.y = -size.h * (scale - 1);

			update();
		}

		function handleMouseDown(e: MouseEvent) {
			// Only allow dragging if the map is zoomed in
			if (scale > 1) {
				isDragging = true;
				dragStart = { x: e.clientX, y: e.clientY };
			}
		}

		function handleMouseMove(e: MouseEvent) {
			if (isDragging) {
				const deltaX = e.clientX - dragStart.x;
				const deltaY = e.clientY - dragStart.y;

				pos.x += deltaX;
				pos.y += deltaY;

				// Make sure the slide stays in its container area
				if (pos.x > 0) pos.x = 0;
				if (pos.x + size.w * scale < size.w) pos.x = -size.w * (scale - 1);
				if (pos.y > 0) pos.y = 0;
				if (pos.y + size.h * scale < size.h) pos.y = -size.h * (scale - 1);

				dragStart = { x: e.clientX, y: e.clientY };
				update();
			}
		}

		function handleMouseUp() {
			isDragging = false;
		}

		node.addEventListener('wheel', scrolled);
		node.addEventListener('mousedown', handleMouseDown);
		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);

		return () => {
			node.removeEventListener('wheel', scrolled);
			node.removeEventListener('mousedown', handleMouseDown);
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
		};
	});

	function update() {
		target.style.transform = `translate(${pos.x}px, ${pos.y}px) scale(${scale}, ${scale})`;
	}
}
