# Define variables
OUTDIR := dist
ENTRY := index.js
BUNDLE := $(OUTDIR)/mailroom-cli.js
NODE := $(shell command -v node)
SEA_CONFIG := sea-config.json
SEA_BLOB := /tmp/sea-prep.blob
SENTINEL := NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2

# Default target
all: $(OUTDIR) $(BUNDLE) copy-node sea postject

# Create output directory
$(OUTDIR):
	mkdir -p $(OUTDIR)

# Bundle the JavaScript file using esbuild
$(BUNDLE): $(ENTRY)
	npx esbuild $(ENTRY) --bundle --platform=node --outfile=$(BUNDLE)

# Copy Node executable to dist
copy-node: $(OUTDIR)
	cp "$(NODE)" $(OUTDIR)/mailroom-cli
	node -e "require('fs').copyFileSync(process.execPath, '$(OUTDIR)/mailroom-cli.exe')"

# Prepare the SEA blob
sea: $(SEA_CONFIG)
	node --experimental-sea-config $(SEA_CONFIG)

# Inject the SEA blob into executables
postject: $(SEA_BLOB)
	npx postject $(OUTDIR)/mailroom-cli NODE_SEA_BLOB $(SEA_BLOB) --sentinel-fuse $(SENTINEL) &
	npx postject $(OUTDIR)/mailroom-cli.exe NODE_SEA_BLOB $(SEA_BLOB) --sentinel-fuse $(SENTINEL) &
	wait

# Clean the output directory
clean:
	rm -rf $(OUTDIR)

.PHONY: all clean copy-node sea postject
