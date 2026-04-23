<script lang="ts">
    import { DFU, DFUse } from 'webdfu';
    import { onMount } from 'svelte';

    // --- Types ---
    type Hardware = 'earth' | 'estuary';
    type IOMap = Record<string, string>;
    type IO = {
        knobs?: IOMap; cv_in?: IOMap; gate_in?: IOMap;
        gate_out?: IOMap; cv_out?: IOMap;
        leds?: string; audio_in?: string; audio_out?: string;
    };
    type FirmwareAsset = { name: string; label: string; download_url: string; description: string; io: IO | null };
    type FlashStatus = 'idle' | 'connecting' | 'connected' | 'fetching' | 'erasing' | 'flashing' | 'done' | 'error';

    const IO_SECTIONS: { key: keyof IO; label: string; slots?: string[] }[] = [
        { key: 'knobs',     label: 'Knobs',     slots: ['1','2','3','4','5','6'] },
        { key: 'cv_in',     label: 'CV In',     slots: ['1','2'] },
        { key: 'gate_in',   label: 'Gate In',   slots: ['1','2'] },
        { key: 'gate_out',  label: 'Gate Out',  slots: ['1','2'] },
        { key: 'cv_out',    label: 'CV Out',    slots: ['1','2'] },
        { key: 'leds',      label: 'LEDs' },
        { key: 'audio_in',  label: 'Audio In' },
        { key: 'audio_out', label: 'Audio Out' },
    ];

    // --- Props ---
    let { initialHardware = 'earth' }: { initialHardware?: Hardware } = $props();

    // --- State ---
    let webUsbSupported = $state(true);
    let selectedHardware = $state<Hardware>(initialHardware);
    let firmwareByHardware = $state<Record<Hardware, FirmwareAsset[]>>({ earth: [], estuary: [] });
    let selectedFirmware = $state<FirmwareAsset | null>(null);
    let device: DFUse.Device | null = null;
    let status = $state<FlashStatus>('idle');
    let statusMessage = $state('');
    let progress = $state(0); // 0-100
    let loadingFirmware = $state(true);
    let firmwareError = $state('');

    const DAISY_VID = 0x0483;
    const DAISY_PID = 0xDF11;
    const TRANSFER_SIZE = 2048;
    const FLASH_START_ADDRESS = 0x90040000; // Daisy QSPI bootloader address

    // --- Derived ---
    let availableFirmware = $derived(firmwareByHardware[selectedHardware] ?? []);
    let canConnect = $derived(
        status === 'idle' && selectedFirmware !== null && webUsbSupported
    );
    let canFlash = $derived(status === 'connected' && selectedFirmware !== null);
    let isWorking = $derived(['connecting', 'fetching', 'erasing', 'flashing'].includes(status));

    // --- Lifecycle ---
    onMount(async () => {
        webUsbSupported = 'usb' in navigator;
        await loadFirmwareList();
    });

    // When hardware changes, reset firmware selection
    $effect(() => {
        selectedHardware;
        selectedFirmware = availableFirmware[0] ?? null;
    });

    // --- Functions ---
    async function loadFirmwareList() {
        loadingFirmware = true;
        firmwareError = '';
        try {
            const res = await fetch('/api/estuary/firmware.json');
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? `Server error: ${res.status}`);
            firmwareByHardware = { earth: data.earth ?? [], estuary: data.estuary ?? [] };
        } catch (e: any) {
            firmwareError = e.message ?? 'Failed to load firmware list.';
        } finally {
            loadingFirmware = false;
        }
    }

    async function connectDevice() {
        status = 'connecting';
        statusMessage = 'Waiting for device selection…';
        try {
            const usbDevice = await navigator.usb.requestDevice({
                filters: [{ vendorId: DAISY_VID, productId: DAISY_PID }],
            });

            const interfaces = DFU.findDeviceDfuInterfaces(usbDevice);
            if (interfaces.length === 0) {
                throw new Error('No DFU interfaces found. Make sure the device is in bootloader mode.');
            }

            device = new DFUse.Device(usbDevice, interfaces[0]);
            await device.open();
            await device.reset();

            status = 'connected';
            statusMessage = 'Device connected. Ready to flash.';
        } catch (e: any) {
            if (e.name !== 'NotFoundError') {
                status = 'error';
                statusMessage = e.message ?? 'Failed to connect.';
            } else {
                status = 'idle';
                statusMessage = '';
            }
            device = null;
        }
    }

    async function flashFirmware() {
        if (!device || !selectedFirmware) return;

        try {
            status = 'fetching';
            statusMessage = `Downloading ${selectedFirmware.label}…`;
            progress = 0;

            const res = await fetch(selectedFirmware.download_url);
            if (!res.ok) throw new Error(`Failed to fetch firmware: ${res.status}`);
            const data = await res.arrayBuffer();

            device.startAddress = FLASH_START_ADDRESS;

            device.logProgress = (bytesSent: number, bytesTotal: number) => {
                if (bytesTotal > 0) {
                    progress = Math.round((bytesSent / bytesTotal) * 100);
                }
            };
            device.logInfo = (msg: string) => { statusMessage = msg; };
            device.logWarning = (msg: string) => { statusMessage = msg; };
            device.logError = (msg: string) => { statusMessage = msg; };

            status = 'erasing';
            statusMessage = 'Erasing flash memory…';

            await device.do_download(TRANSFER_SIZE, data, true);

            status = 'done';
            statusMessage = 'Firmware flashed successfully! Unplug and replug your device.';
            progress = 100;
        } catch (e: any) {
            status = 'error';
            statusMessage = e.message ?? 'Flash failed.';
        }
    }

    function reset() {
        status = 'idle';
        statusMessage = '';
        progress = 0;
        device = null;
    }
</script>

<div class="font-mono text-sm flex flex-col gap-6">

    {#if !webUsbSupported}
        <div class="border border-dashed border-[var(--color-Orange)] p-4 text-[var(--color-Orange)]">
            WebUSB is not supported in this browser. Please use Chrome or Edge to flash firmware.
        </div>
    {/if}

    <!-- Hardware selector -->
    <div>
        <p class="text-xs uppercase tracking-widest text-textColor/50 mb-3">Hardware</p>
        <div class="flex gap-0 border border-dashed border-borderColor/30">
            {#each (['earth', 'estuary'] as Hardware[]) as hw}
                <button
                    type="button"
                    onclick={() => { selectedHardware = hw; status = 'idle'; device = null; }}
                    disabled={isWorking}
                    class="flex-1 py-2 px-4 text-center transition-colors
                        {selectedHardware === hw
                            ? 'bg-textColor text-backgroundColor'
                            : 'hover:bg-textColor/10'}"
                >
                    {hw}
                </button>
            {/each}
        </div>
    </div>

    <!-- Firmware selector -->
    <div>
        <p class="text-xs uppercase tracking-widest text-textColor/50 mb-3">Firmware</p>
        {#if loadingFirmware}
            <p class="text-textColor/50">Loading firmware list…</p>
        {:else if firmwareError}
            <div class="border border-dashed border-[var(--color-Orange)] p-3 text-[var(--color-Orange)]">
                {firmwareError}
                <button onclick={loadFirmwareList} class="underline ml-2">Retry</button>
            </div>
        {:else if availableFirmware.length === 0}
            <p class="text-textColor/50">No firmware available yet for {selectedHardware}.</p>
        {:else}
            <div class="flex flex-col border border-dashed border-borderColor/30">
                {#each availableFirmware as fw}
                    <button
                        type="button"
                        onclick={() => { selectedFirmware = fw; }}
                        disabled={isWorking}
                        class="py-2 px-4 text-left transition-colors border-b border-dashed border-borderColor/30 last:border-b-0
                            {selectedFirmware?.name === fw.name
                                ? 'bg-textColor text-backgroundColor'
                                : 'hover:bg-textColor/10'}"
                    >
                        {fw.label}
                    </button>
                {/each}
            </div>
        {/if}
    </div>

    <!-- IO metadata -->
    {#if selectedFirmware?.io}
        {@const io = selectedFirmware.io}
        <div class="border border-dashed border-borderColor/30">
            {#if selectedFirmware.description}
                <p class="px-4 py-3 text-textColor/70 border-b border-dashed border-borderColor/30">
                    {selectedFirmware.description}
                </p>
            {/if}
            <div class="divide-y divide-dashed divide-borderColor/30">
                {#each IO_SECTIONS as section}
                    {@const val = io[section.key]}
                    {#if val !== undefined}
                        <div class="px-4 py-2 grid grid-cols-[6rem_1fr] gap-4 items-start">
                            <span class="text-xs uppercase tracking-widest text-textColor/40 pt-0.5">{section.label}</span>
                            {#if section.slots}
                                <div class="flex flex-col gap-1">
                                    {#each section.slots as slot}
                                        {@const desc = (val as Record<string,string>)[slot]}
                                        {#if desc}
                                            <div class="grid grid-cols-[1.25rem_1fr] gap-2 {desc === 'unused' ? 'text-textColor/25' : ''}">
                                                <span>{slot}</span>
                                                <span>{desc}</span>
                                            </div>
                                        {/if}
                                    {/each}
                                </div>
                            {:else}
                                <span class="{val === 'unused' ? 'text-textColor/25' : ''}">{val}</span>
                            {/if}
                        </div>
                    {/if}
                {/each}
            </div>
        </div>
    {/if}

    <!-- Actions -->
    {#if status === 'idle' || status === 'error'}
        <button
            type="button"
            onclick={connectDevice}
            disabled={!canConnect}
            class="border border-dashed border-borderColor px-4 py-2 transition-colors
                enabled:hover:bg-textColor enabled:hover:text-backgroundColor
                disabled:opacity-30 disabled:cursor-not-allowed"
        >
            Connect device
        </button>
    {:else if status === 'connected'}
        <button
            type="button"
            onclick={flashFirmware}
            disabled={!canFlash}
            class="bg-textColor text-backgroundColor px-4 py-2 transition-opacity
                enabled:hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
        >
            Flash "{selectedFirmware?.label}"
        </button>
    {:else if status === 'done'}
        <button
            type="button"
            onclick={reset}
            class="border border-dashed border-borderColor px-4 py-2 hover:bg-textColor hover:text-backgroundColor transition-colors"
        >
            Flash another
        </button>
    {/if}

    <!-- Progress + status -->
    {#if isWorking || status === 'done' || status === 'error'}
        <div class="flex flex-col gap-2">
            {#if isWorking || status === 'done'}
                <div class="w-full border border-dashed border-borderColor/30 h-2">
                    <div
                        class="h-full bg-textColor transition-all"
                        style="width: {progress}%"
                    ></div>
                </div>
            {/if}
            <p class="{status === 'error' ? 'text-[var(--color-Orange)]' : 'text-textColor/70'}">
                {statusMessage}
            </p>
        </div>
    {/if}

</div>
