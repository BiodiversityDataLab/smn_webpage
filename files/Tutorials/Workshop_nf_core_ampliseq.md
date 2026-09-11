
## 1. Background information

### What nf-core/ampliseq is good for

- **Amplicon analysis end-to-end**: quality handling, primer trimming, denoising (ASV inference), taxonomic annotation, and report generation.
- **Reproducible workflow**: same pipeline logic and software versions across users and systems.
- **Good for marker-gene studies**: e.g., ITS, 16S, 18S, and similar amplicon datasets.
- **Scales from 1 to many samples**: one command pattern, only samplesheet size changes.

### What screen is good for

- **Persistent shell session**: commands keep running after disconnects.
- **Critical for long Nextflow jobs**: avoids losing active runs when SSH/VS Code drops.
- **Easy detach/re-attach**: continue exactly where you left off.

### Required input for nf-core/ampliseq

- **FASTQ files** (single-end for this PacBio workshop example).
- **Samplesheet** (`sample`, `fastq_1`) for robust file control.
- **Primer sequences** (`--FW_primer`, `--RV_primer`) set once per run if shared by all samples.
- **Execution profile + project allocation** for HPC usage.

### Workshop-specific assumptions

- Data are treated as PacBio amplicons, so use `--pacbio`.
- For PacBio single-end input, `fastq_2` is not required.
- Primer set used in workshop:
  - Forward: `GTACACACCGCCCGTCG`
  - Reverse: `CCTSCSCTTANTDATATGC`

## 2. Usage

### 2.1 Logging in to Dardel/UPPMAX

#### Dardel (PDC)

```bash
ssh <PDC_USERNAME>@dardel.pdc.kth.se
```

- Opens an SSH session to Dardel.

#### UPPMAX

```bash
ssh <UPPMAX_USERNAME>@pelle.uppmax.uu.se
```

- Opens an SSH session to UPPMAX Rackham (adjust host if your project uses another cluster).

### 2.2 Screen: practical commands and what they do

```bash
screen -S ampliseq
```
- Starts a new named screen session called `ampliseq`.

```bash
echo $STY
```
- Prints the active screen session ID if you are currently inside screen.

```text
Ctrl + A, then D
```
- Detaches from the screen session and leaves all running jobs active.

```bash
screen -ls
```
- Lists all your existing screen sessions.

```bash
screen -r ampliseq
```
- Re-attaches to a detached session named `ampliseq`.

```bash
screen -d -r <session_id>
```
- Force-detaches and re-attaches a session if it appears locked elsewhere.

```bash
exit
```
- Ends current shell; if done inside screen without detaching first, that shell/session closes.

### 2.3 Loading the environment (split by system)

#### Dardel

```bash
module load nextflow
nextflow -version
```
- Loads Nextflow module and confirms version.

```bash
nextflow pull nf-core/ampliseq
nextflow run nf-core/ampliseq --help
```
- Downloads/updates the pipeline and shows command help.

```bash
module load PDC/26.03
module load apptainer/1.5.1-cpeGNU-26.03
apptainer --version
```
- Loads Apptainer runtime used to run containerized pipeline software reproducibly.

#### UPPMAX

```bash
module load bioinfo-tools
module load Nextflow
nextflow -version
```
- Loads common UPPMAX bioinformatics environment and Nextflow.

```bash
module load apptainer
apptainer --version
```
- Loads Apptainer (or Singularity-compatible runtime, depending on site setup).

```bash
nextflow pull nf-core/ampliseq
nextflow run nf-core/ampliseq --help
```
- Downloads/updates ampliseq pipeline and prints usage.

### 2.4 Download sample data and organize files

Create a clean project structure:

```bash
mkdir -p Workshop/Dataset
cd Workshop/Dataset
```
- Creates and enters a dataset folder.

Download workshop FASTQ files:

```bash
wget -O dataset1.fastq.gz ftp://ftp.sra.ebi.ac.uk/vol1/fastq/ERR116/087/ERR11608487/ERR11608487.fastq.gz
wget -O dataset2.fastq.gz ftp://ftp.sra.ebi.ac.uk/vol1/fastq/ERR116/089/ERR11608489/ERR11608489.fastq.gz
wget -O dataset3.fastq.gz ftp://ftp.sra.ebi.ac.uk/vol1/fastq/ERR116/091/ERR11608491/ERR11608491.fastq.gz
wget -O dataset4.fastq.gz ftp://ftp.sra.ebi.ac.uk/vol1/fastq/ERR116/093/ERR11608493/ERR11608493.fastq.gz
wget -O dataset5.fastq.gz ftp://ftp.sra.ebi.ac.uk/vol1/fastq/ERR116/094/ERR11608494/ERR11608494.fastq.gz
```
- Downloads all five example files with stable local names.
- all from [ENA Browser](https://www.ebi.ac.uk/ena/browser/view/PRJEB63550)
- Project: PRJEB63550
- Study Title: The Global Soil Mycobiome consortium dataset from the University of Tartu

Write primer file (optional reference file):

```bash
cat > Primer.txt << 'EOF'
PRIMER_F=GTACACACCGCCCGTCG
PRIMER_R=CCTSCSCTTANTDATATGC
EOF
```
- Stores primer sequences in one place for easier use

Create samplesheets:

```bash
cat > samplesheet_single.tsv << 'EOF'
sample	fastq_1
sample_1	./Dataset/dataset1.fastq.gz
EOF
```
- Defines one sample for a quick validation run.

```bash
cat > samplesheet_all.tsv << 'EOF'
sample	fastq_1
sample_1	./Dataset/dataset1.fastq.gz
sample_2	./Dataset/dataset2.fastq.gz
sample_3	./Dataset/dataset3.fastq.gz
sample_4	./Dataset/dataset4.fastq.gz
sample_5	./Dataset/dataset5.fastq.gz
EOF
```
- Defines all workshop samples for the full run.

Note: Linux paths are case-sensitive. If your folder is named `dataset`, use `./dataset/...` consistently.

### 2.5 Run ampliseq (both Dardel and UPPMAX)

#### Common parameters used in this workshop

- `--pacbio`: enables PacBio-specific handling.
- `--FW_primer` and `--RV_primer`: primer trimming setup.
- `--input`: samplesheet path.
- `--outdir`: where results are written.

#### 2.5.1 Single sample

Dardel:

```bash
nextflow run nf-core/ampliseq \
  -profile pdc_kth \
  --project {your Project ID} \
  --input Dataset/samplesheet_single.tsv \
  --pacbio \
  --FW_primer GTACACACCGCCCGTCG \
  --RV_primer CCTSCSCTTANTDATATGC \
  --outdir results/single_dardel
```

- Uses Dardel institutional profile and PDC project allocation.

UPPMAX

```bash
nextflow run nf-core/ampliseq \
  -profile uppmax \
  --project uppmax{your project ID} \
  --input Dataset/samplesheet_single.tsv \
  --pacbio \
  --FW_primer GTACACACCGCCCGTCG \
  --RV_primer CCTSCSCTTANTDATATGC \
  --outdir results/single_uppmax
```

- Uses UPPMAX profile and your UPPMAX compute allocation.

Use specific version (if Nextflow is outdated)

```bash
~/bin/nextflow run nf-core/ampliseq \
-profile uppmax \
  --project uppmax{your project ID} \
  --input dataset/samplesheet_single.tsv \
  --pacbio \
  --FW_primer GTACACACCGCCCGTCG \
  --RV_primer CCTSCSCTTANTDATATGC \
  --outdir results/single_uppmax
```

Resume failed/interrupted runs:

```bash
nextflow run nf-core/ampliseq <same-parameters-as-before> -resume
```

- Reuses completed steps and continues from last successful state.

#### 2.5.2 Several samples at once

Dardel:

```bash
nextflow run nf-core/ampliseq \
  -profile pdc_kth \
  --project {your project ID} \
  --input Dataset/samplesheet_all.tsv \
  --pacbio \
  --FW_primer GTACACACCGCCCGTCG \
  --RV_primer CCTSCSCTTANTDATATGC \
  --outdir results/all_dardel
```

UPPMAX:

```bash
nextflow run nf-core/ampliseq \
  -profile uppmax \
  --project {your project ID} \
  --input Dataset/samplesheet_all.tsv \
  --pacbio \
  --FW_primer GTACACACCGCCCGTCG \
  --RV_primer CCTSCSCTTANTDATATGC \
  --outdir results/all_uppmax
```

- Same command logic as single-sample mode, only the samplesheet content changes.

#### 2.5.3 Logs: where to find them and how to interpret

List hidden files in the run directory:

```bash
ls -la
```

- Confirms presence of `.nextflow.log` and run artifacts.

Watch the main Nextflow log live:

```bash
tail -f .nextflow.log
```

- Streams scheduler submissions, task state, warnings, and failures.

Search for explicit error lines:

```bash
grep -i "error\|failed" .nextflow.log
```

- Quickly identifies likely failure points.

Useful interpretation checklist:

- Look for `ERROR` blocks near the end of `.nextflow.log`.
- Identify the failing process name (e.g., a specific module step).
- Open the corresponding task work directory (`work/...`) to inspect `.command.err` and `.command.out`.
- Distinguish infrastructure issues (quota, walltime, scheduler, permissions) from biological/data issues (wrong primers, invalid input format).

## 3. Run ampliseq on a laptop/computer (no Dardel/UPPMAX)

### 3.1 Install prerequisites

- Install **Docker Desktop** (Windows/macOS) or Docker Engine (Linux).
- Install **Java (>=17)** for Nextflow.
- Install **Nextflow**.

Example Nextflow install (Linux/macOS):

```bash
curl -s https://get.nextflow.io | bash
sudo mv nextflow /usr/local/bin/
nextflow -version
```

### 3.2 Prepare local project

```bash
mkdir -p ampliseq_local/Dataset
cd ampliseq_local
nextflow pull nf-core/ampliseq
```

- Creates workspace and fetches latest pipeline revision.

### 3.3 Download demo data and build samplesheet

Use the same FASTQ URLs and samplesheet templates from section 2.4.

### 3.4 Optional: download taxonomy database/classifier

If you want custom taxonomy annotation, place your classifier in a folder, e.g.:

```bash
mkdir -p db
# Put your classifier file here, for example: db/silva-138-99-nb-classifier.qza
```

- Keeps annotation resources versioned and explicit.

### 3.5 Run with Docker profile

Single sample (local):

```bash
nextflow run nf-core/ampliseq \
  -profile docker \
  --input Dataset/samplesheet_single.tsv \
  --pacbio \
  --FW_primer GTACACACCGCCCGTCG \
  --RV_primer CCTSCSCTTANTDATATGC \
  --outdir results/local_single
```

All samples (local):

```bash
nextflow run nf-core/ampliseq \
  -profile docker \
  --input Dataset/samplesheet_all.tsv \
  --pacbio \
  --FW_primer GTACACACCGCCCGTCG \
  --RV_primer CCTSCSCTTANTDATATGC \
  --outdir results/local_all
```

Example with custom classifier:

```bash
nextflow run nf-core/ampliseq \
  -profile docker \
  --input Dataset/samplesheet_all.tsv \
  --pacbio \
  --FW_primer GTACACACCGCCCGTCG \
  --RV_primer CCTSCSCTTANTDATATGC \
  --classifier db/silva-138-99-nb-classifier.qza \
  --outdir results/local_all_custom_db
```

## 4. Common changes/add-ons (grouped)

For more information see: [ampliseq: Parameters](https://nf-co.re/ampliseq/2.18.0/parameters/)

### A. Annotation and reference databases

- Default refernc Database is SILVA
```
--dada_ref_taxonomy = 
```
- Use a **user-defined taxonomy classifier** with `--classifier <path_to_qza>`.
- Choose classifier according to marker and region (e.g., SILVA for 16S/18S, UNITE for ITS).
- Keep database version documented in your run notes.

### B. Primers and marker setup

- Change primer sequences using `--FW_primer` and `--RV_primer`.
- Use marker-appropriate primers (ITS vs 16S vs 18S).
- If primers are ambiguous/degenerate, verify expected IUPAC symbols and orientation.

### C. Input and sample handling

- Prefer samplesheets when filenames are non-standard.
- Add or remove samples by editing the samplesheet only.
- For paired-end data (non-PacBio), include both `fastq_1` and `fastq_2` columns.

### D. Runtime and reproducibility

- Use `-resume` after interruptions.
- Pin pipeline revision for stable workshops, e.g. `-r <tag>`.
- Keep a copy of command lines, samplesheet, and `.nextflow.log` for reproducibility.

### E. Compute/performance tuning

- Start with institutional profile defaults (`pdc_kth`, `uppmax`, or `docker`).
- Increase resources only for failing bottleneck steps, based on log evidence.
- Monitor storage quota and temporary work directory growth.

### F. Troubleshooting shortcuts

- `nextflow run nf-core/ampliseq --help`: verify parameter names quickly.
- `tail -f .nextflow.log`: monitor progress and errors live.
- `grep -i "error\|failed" .nextflow.log`: jump to likely failure sections.
- Check task-level logs in `work/<hash>/` for root-cause messages.

## Quick workshop checklist

- SSH login works on target system.
- `screen` session can be created, detached, and resumed.
- Nextflow and container runtime load correctly.
- One sample starts successfully.
- All samples start successfully.
- Log interpretation path is clear (`.nextflow.log` -> `work/.../.command.err`).
