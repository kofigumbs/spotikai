.PHONY: librespot
librespot:
	RUSTUP=`mktemp`; \
				 curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs > $$RUSTUP; \
				 sh $$RUSTUP -y
	cargo install librespot --version 0.1.1 --locked
